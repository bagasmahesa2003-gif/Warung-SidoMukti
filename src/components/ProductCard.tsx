import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  key?: React.Key;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, cart } = useCart();
  const cartItem = cart.find(item => item.product.id === product.id);
  const isOutOfStock = product.stock <= 0;
  const isStockReached = cartItem ? cartItem.quantity >= product.stock : false;
  const isDisabled = isOutOfStock || isStockReached;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full font-medium text-sm">
              Stok Habis
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4 sm:p-5">
        <div className="text-sm text-green-600 font-medium mb-1">{product.category}</div>
        <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">{product.name}</h3>
        
        <div className="flex items-end justify-between mt-4">
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Harga / kg</p>
            <p className="font-bold text-gray-900 text-lg">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
          </div>
          
          <button
            onClick={() => addToCart(product)}
            disabled={isDisabled}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
              isDisabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
