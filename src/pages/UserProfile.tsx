import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package } from 'lucide-react';
import { Order } from '../types';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export const UserProfile = () => {
  const { user, loading, logoutMock } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!db) return;

    const qOrders = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(qOrders, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      data.sort((a, b) => {
        const timeA = a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any).toDate?.().getTime() || 0) : 0;
        const timeB = b.createdAt ? (typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any).toDate?.().getTime() || 0) : 0;
        return timeB - timeA;
      });
      setOrders(data);
    }, (error) => console.error(error));

    return () => unsubscribe();
  }, [user, loading, navigate]);

  const handleLogout = () => {
    if (!auth) logoutMock();
    else signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
            <p className="text-gray-500 mt-1">{(user as any).email}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" /> Riwayat Pesanan
          </h2>
          
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada pesanan.</p>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500 font-mono">ID: {order.id}</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {order.createdAt ? new Date((order.createdAt as any).toDate?.() || order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tanggal tidak valid'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                      order.status === 'selesai' ? 'bg-green-100 text-green-700' :
                      order.status === 'dikirim' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.product.name} x {item.quantity}</span>
                        <span className="font-medium text-gray-900">
                          Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-500">Total Pembayaran</span>
                    <span className="font-bold text-green-700 text-lg">
                      Rp {(order.total || order.totalPrice || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                    <p><span className="text-gray-500">Metode Pengiriman:</span> <span className="font-medium text-gray-900">{order.metodePengiriman || order.deliveryMethod}</span></p>
                    {((order.metodePengiriman === 'Dikirim' || order.deliveryMethod === 'delivery') && (order.alamatLengkap || order.address)) && (
                      <p><span className="text-gray-500">Alamat:</span> <span className="font-medium text-gray-900">{order.alamatLengkap || order.address}</span></p>
                    )}
                    <p><span className="text-gray-500">Nomor HP:</span> <span className="font-medium text-gray-900">{order.nomorHP || order.phone}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
