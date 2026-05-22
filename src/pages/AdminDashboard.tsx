import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Product, Order } from '../types';
import { Package, ShoppingBag, LogOut, Plus, Trash2, Edit, X, Search, Filter, ArrowRight, TrendingUp } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { getMockProducts, getMockOrders, saveMockProduct, deleteMockProduct, updateMockOrderStatus } from '../utils/mockDb';

export const AdminDashboard = () => {
  const { user, loading, logoutMock } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');
  
  const [products, setProducts] = useState<Product[]>(getMockProducts());
  const [orderDateFilter, setOrderDateFilter] = useState('');

  const [orders, setOrders] = useState<Order[]>(getMockOrders());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', price: 0, stock: 0, category: 'Sayuran', imageUrl: '' });

  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('Semua');
  const [orderStatusFilter, setOrderStatusFilter] = useState('Semua');
  const [revenueMonthFilter, setRevenueMonthFilter] = useState('Semua');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else {
        // Enforce Admin Access
        const allowedAdmins = ['bagasmahesa2003@gmail.com', 'anggoromukti18@gmail.com'];
        if (user.email && !allowedAdmins.includes(user.email)) {
          navigate('/');
        }
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (loading || !user) return;

    if (!db) {
      const updateData = () => {
        setProducts(getMockProducts());
        const rawOrders = getMockOrders();
        rawOrders.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(rawOrders);
      };
      updateData();
      window.addEventListener('mock_data_updated', updateData);
      return () => window.removeEventListener('mock_data_updated', updateData);
    }
    
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => console.error(error));

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => console.error(error));

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [user, loading]);

  const handleLogout = () => {
    if (!auth) logoutMock();
    else signOut(auth);
    navigate('/login');
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (!db) {
      updateMockOrderStatus(orderId, status);
      return;
    }
    await updateDoc(doc(db, 'orders', orderId), { status });
  };

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ name: product.name, price: product.price, stock: product.stock, category: product.category, imageUrl: product.imageUrl });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', price: 0, stock: 0, category: 'Sayuran', imageUrl: '' });
    }
    setIsModalOpen(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      const newProduct: Product = {
        id: editingProduct ? editingProduct.id : Math.random().toString().substring(2, 8),
        ...productForm,
        createdAt: editingProduct ? editingProduct.createdAt : Date.now()
      };
      saveMockProduct(newProduct);
      setIsModalOpen(false);
      return;
    }

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), { ...productForm });
      } else {
        await addDoc(collection(db, 'products'), { ...productForm, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Gagal menyimpan produk. Cek aturan keamanan (Rules) Firestore Anda.");
    }
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      if (!db) {
        deleteMockProduct(productToDelete.id);
      } else {
        await deleteDoc(doc(db, 'products', productToDelete.id));
      }
      setProductToDelete(null);
    }
  };

  const todayStats = orders.reduce(
    (acc, order) => {
      const orderDate = order.createdAt ? new Date((order.createdAt as any).toDate?.() || order.createdAt) : new Date(0);
      const today = new Date();
      if (orderDate.toDateString() === today.toDateString() && order.status !== 'dibatalkan') {
        acc.revenue += order.totalPrice;
        acc.count += 1;
      }
      return acc;
    },
    { revenue: 0, count: 0 }
  );

  const revenueHistory = orders.reduce((acc, order) => {
    if (order.status !== 'dibatalkan') {
      const dateObj = order.createdAt ? new Date((order.createdAt as any).toDate?.() || order.createdAt) : new Date(0);
      const dateStr = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      const monthYearStr = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
      const rawDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
      
      if (!acc[dateStr]) {
        acc[dateStr] = { count: 0, revenue: 0, rawDate, monthYearStr };
      }
      acc[dateStr].count += 1;
      acc[dateStr].revenue += order.totalPrice;
    }
    return acc;
  }, {} as Record<string, { count: number, revenue: number, rawDate: number, monthYearStr: string }>);

  const availableRevenueMonths = Array.from(new Set(
    (Object.values(revenueHistory) as { monthYearStr: string }[]).map(h => h.monthYearStr)
  ));

  const sortedRevenueHistory = (Object.entries(revenueHistory) as [string, { count: number, revenue: number, rawDate: number, monthYearStr: string }][])
    .filter(([, stats]) => revenueMonthFilter === 'Semua' || stats.monthYearStr === revenueMonthFilter)
    .sort(([, a], [, b]) => b.rawDate - a.rawDate);
    
  const filteredTotalRevenue = sortedRevenueHistory.reduce((sum, [, stats]) => sum + stats.revenue, 0);

  const productCategories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory = productCategory === 'Semua' || p.category === productCategory;
    return matchSearch && matchCategory;
  });

  const filteredOrders = orders.filter(o => {
    const matchStatus = orderStatusFilter === 'Semua' || o.status === orderStatusFilter;
    let matchDate = true;
    if (orderDateFilter) {
      const orderDate = o.createdAt ? new Date((o.createdAt as any).toDate?.() || o.createdAt) : new Date(0);
      const filterParts = orderDateFilter.split('-');
      if (filterParts.length === 3) {
        const fYear = parseInt(filterParts[0], 10);
        const fMonth = parseInt(filterParts[1], 10) - 1;
        const fDay = parseInt(filterParts[2], 10);
        matchDate = orderDate.getFullYear() === fYear && orderDate.getMonth() === fMonth && orderDate.getDate() === fDay;
      }
    }
    return matchStatus && matchDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pt-16">
      {/* Sidebar - Horizontal on Mobile, Vertical on Desktop */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 flex flex-row md:flex-col gap-4 md:h-[calc(100vh-64px)] md:sticky top-16 z-10 overflow-x-auto hide-scrollbar">
        <h2 className="text-xl font-bold text-gray-800 hidden md:block mb-4">Admin Dashboard</h2>
        <div className="flex flex-row md:flex-col gap-2 flex-1 min-w-max md:min-w-0">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${activeTab === 'orders' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ShoppingBag className="w-5 h-5" /> <span className="whitespace-nowrap">Pesanan</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${activeTab === 'products' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Package className="w-5 h-5" /> <span className="whitespace-nowrap">Produk</span>
          </button>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition md:mt-auto">
          <LogOut className="w-5 h-5" /> <span className="whitespace-nowrap hidden sm:block md:block">Keluar</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-gray-500 text-sm font-medium">Pesanan Hari Ini</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{todayStats.count}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-orange-500">
            <p className="text-gray-500 text-sm font-medium">Menunggu Konfirmasi</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{orders.filter(o => o.status === 'diproses').length}</h3>
          </div>
          <div 
            onClick={() => setIsRevenueModalOpen(true)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-green-500 cursor-pointer hover:bg-green-50 transition"
          >
            <p className="text-gray-500 text-sm font-medium">Pendapatan Hari Ini</p>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-2">
              Rp {todayStats.revenue.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">Lihat Detail <ArrowRight className="w-3 h-3" /></p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
            <p className="text-gray-500 text-sm font-medium">Stok Menipis</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{products.filter(p => p.stock < 5).length}</h3>
          </div>
        </div>

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-gray-900 whitespace-nowrap">Kelola Pesanan</h3>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={orderDateFilter}
                    onChange={(e) => setOrderDateFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 text-gray-700"
                  />
                  {orderDateFilter && (
                    <button onClick={() => setOrderDateFilter('')} className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 transition">
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100 overflow-x-auto w-full sm:w-auto">
                  {['Semua', 'diproses', 'dikirim', 'selesai'].map(status => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors whitespace-nowrap ${orderStatusFilter === status ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-sm">
                    <th className="pb-4 font-medium">Waktu & Tanggal</th>
                    <th className="pb-4 font-medium">Pelanggan</th>
                    <th className="pb-4 font-medium">Total</th>
                    <th className="pb-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td className="py-4">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {order.createdAt ? new Date((order.createdAt as any).toDate?.() || order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tanggal tidak valid'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">ID: {order.id.slice(0,6)}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.phone}</p>
                      </td>
                      <td className="py-4 font-semibold text-green-700">Rp {order.totalPrice.toLocaleString('id-ID')}</td>
                      <td className="py-4">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none w-32"
                        >
                          <option value="diproses">Diproses</option>
                          <option value="dikirim">Dikirim</option>
                          <option value="selesai">Selesai</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold text-gray-900">Kelola Produk</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 w-full"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 appearance-none bg-white min-w-[120px]"
                  >
                    {productCategories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => openProductModal()} className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 whitespace-nowrap">
                  <Plus className="w-4 h-4"/> Tambah Produk
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-sm">
                    <th className="pb-4 font-medium">Sayuran</th>
                    <th className="pb-4 font-medium">Kategori</th>
                    <th className="pb-4 font-medium">Harga/kg</th>
                    <th className="pb-4 font-medium">Stok</th>
                    <th className="pb-4 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td className="py-4 flex items-center gap-3">
                        <img src={product.imageUrl || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </td>
                      <td className="py-4 text-gray-600">{product.category}</td>
                      <td className="py-4 font-medium">Rp {product.price.toLocaleString('id-ID')}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {product.stock} kg
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openProductModal(product)} className="p-1 text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4"/></button>
                          <button onClick={() => setProductToDelete(product)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
      
      {/* Product Modal */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">Buku Pendapatan Harian</h3>
              </div>
              <div className="flex items-center gap-4">
                <select 
                  value={revenueMonthFilter}
                  onChange={(e) => setRevenueMonthFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="Semua">Semua Waktu</option>
                  {availableRevenueMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button onClick={() => setIsRevenueModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><X className="w-5 h-5"/></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-4">
                {sortedRevenueHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Belum ada data pendapatan.</p>
                ) : (
                  sortedRevenueHistory.map(([date, stats]) => (
                    <div key={date} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-green-100 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{date}</p>
                        <p className="text-sm text-gray-500 mt-1">{stats.count} Pesanan diselesaikan</p>
                      </div>
                      <div className="mt-2 sm:mt-0 text-right">
                        <p className="text-sm text-gray-500 mb-1">Total</p>
                        <p className="text-lg font-bold text-green-700">Rp {stats.revenue.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Akumulasi</p>
                <p className="text-sm text-gray-400">{revenueMonthFilter === 'Semua' ? 'Seluruh Waktu' : `Bulan ${revenueMonthFilter}`}</p>
              </div>
              <p className="text-2xl font-bold text-green-700">
                Rp {filteredTotalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={saveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sayuran</label>
                <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga/kg (Rp)</label>
                  <input required type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Tersedia (kg)</label>
                  <input required type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <input required type="text" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar</label>
                <input type="url" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition">Batal</button>
                <button type="submit" className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Produk?</h3>
            <p className="text-gray-500 mb-6">
              Anda yakin ingin menghapus <span className="font-semibold text-gray-800">{productToDelete.name}</span> dari daftar? Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setProductToDelete(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition">Batal</button>
              <button onClick={confirmDeleteProduct} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
