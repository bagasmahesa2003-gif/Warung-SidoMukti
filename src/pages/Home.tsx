import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import { getMockProducts } from '../utils/mockDb';

export const Home = () => {
  const [products, setProducts] = useState<Product[]>(getMockProducts());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');

  useEffect(() => {
    if (!db) {
      const updateProducts = () => setProducts(getMockProducts());
      updateProducts();
      window.addEventListener('mock_data_updated', updateProducts);
      return () => window.removeEventListener('mock_data_updated', updateProducts);
    }
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      // Sort client side to handle items without createdAt safely
      data.sort((a, b) => {
        const timeA = a.createdAt ? (typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any).toDate?.().getTime() || 0) : 0;
        const timeB = b.createdAt ? (typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any).toDate?.().getTime() || 0) : 0;
        return timeB - timeA;
      });
      setProducts(data);
    }, (error) => {
      console.warn("Error fetching products:", error.message);
    });

    return () => unsubscribe();
  }, []);

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'Semua' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      {/* Hero Section */}
      <div className="bg-green-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Sayuran Segar SidoMukti
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-green-100 text-lg md:text-xl max-w-2xl mx-auto"
          >
            Dari kebun petani lokal langsung ke dapur Anda. Kualitas terjamin, harga bersahabat.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between border border-gray-100">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Cari sayuran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-colors ${
                  category === cat 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4 text-xl">Sayuran tidak ditemukan.</div>
          </div>
        )}
      </div>
    </div>
  );
};
