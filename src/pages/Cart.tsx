import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ArrowLeft, CheckCircle, Minus, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { addMockOrder, reduceMockProductStock } from '../utils/mockDb';

export const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    paymentMethod: 'COD',
    deliveryMethod: 'delivery' as 'pickup' | 'delivery'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!db) {
        // Validation check for empty cart
        if (cart.length === 0) return;

        addMockOrder({
          id: 'ORD-' + Math.random().toString().substring(2, 8),
          userId: user.uid,
          userEmail: user.email || '',
          namaLengkap: formData.name,
          alamatLengkap: formData.deliveryMethod === 'pickup' ? '' : formData.address,
          nomorHP: formData.phone,
          metodePengiriman: formData.deliveryMethod === 'pickup' ? 'Ambil di Toko' : 'Dikirim',
          items: cart,
          total: cartTotal,
          status: 'diproses',
          createdAt: Date.now()
        });

        // Reduce mock stock
        cart.forEach(item => {
          reduceMockProductStock(item.product.id, item.quantity);
        });

        setOrderSuccess(true);
        clearCart();
        return;
      }

      const orderData = {
        userId: user.uid,
        userEmail: user.email || '',
        namaLengkap: formData.name,
        alamatLengkap: formData.deliveryMethod === 'pickup' ? '' : formData.address,
        nomorHP: formData.phone,
        metodePengiriman: formData.deliveryMethod === 'pickup' ? 'Ambil di Toko' : 'Dikirim',
        items: cart,
        total: cartTotal,
        status: 'diproses',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);

      // Reduce firebase stock
      await Promise.all(cart.map(item => {
        const prodRef = doc(db, 'products', item.product.id);
        return updateDoc(prodRef, {
          stock: increment(-item.quantity)
        });
      }));

      setOrderSuccess(true);
      clearCart();
    } catch (error) {
      alert("Gagal membuat pesanan. Pastikan Firebase sudah disetup (Aturan Firestore mungkin memblokir ini).");
      console.error("Checkout error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-4 flex flex-col items-center">
        <CheckCircle className="text-green-500 w-20 h-20 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Berhasil!</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          Terima kasih telah berbelanja di SidoMukti. Pesanan Anda akan segera kami proses.
        </p>
        <Link to="/" className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition">
          Kembali Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-green-700 font-medium mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Lanjut Belanja
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Keranjang Belanja</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500 mb-6">Keranjang masih kosong.</p>
            <Link to="/" className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  key={item.product.id} 
                  className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-4 border border-gray-100 shadow-sm"
                >
                  <div className="w-full sm:w-24 h-48 sm:h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {item.product.imageUrl && (
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">{item.product.category}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4 sm:mt-0">
                      <span className="font-bold text-green-700">Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="bg-gray-50 p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-medium px-3 flex-1 text-center min-w-[2.5rem]">
                            {item.quantity}
                          </span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="bg-gray-50 p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Pengiriman</h3>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pengambilan Produk</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="deliveryMethod" 
                        value="pickup" 
                        checked={formData.deliveryMethod === 'pickup'} 
                        onChange={() => setFormData({ ...formData, deliveryMethod: 'pickup' })} 
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Ambil di Toko</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="deliveryMethod" 
                        value="delivery" 
                        checked={formData.deliveryMethod === 'delivery'} 
                        onChange={() => setFormData({ ...formData, deliveryMethod: 'delivery' })} 
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Dikirim</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP / WA</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                
                {formData.deliveryMethod === 'delivery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                    <textarea required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                    <option value="COD">Bayar di Tempat (COD)</option>
                    <option value="Transfer">Transfer Bank</option>
                  </select>
                  {formData.paymentMethod === 'Transfer' && (
                    <p className="text-sm text-green-600 mt-2">
                      Konfirmasi pembayaran lewat WhatsApp setelah melakukan transfer.
                    </p>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-medium">Total Harga</span>
                    <span className="text-xl font-bold text-gray-900">Rp {cartTotal.toLocaleString('id-ID')}</span>
                  </div>
                  {!user ? (
                    <button 
                      type="button" 
                      onClick={() => navigate('/login')}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                    >
                      Login untuk Buat Pesanan
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Memproses...' : 'Buat Pesanan'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
