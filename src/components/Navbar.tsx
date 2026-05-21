import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User as UserIcon, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { cart } = useCart();
  const { user, loading } = useAuth();

  const totalItems = cart.reduce((temp, item) => temp + item.quantity, 0);

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-green-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logogoro.png" alt="SidoMukti Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold text-xl text-green-800 tracking-tight">SidoMukti</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="text-gray-600 hover:text-green-600 font-medium hidden sm:block">Home</Link>
            
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-green-600 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-green-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>

            {!loading ? (
              <Link 
                to={user ? ((user.email && ['bagasmahesa2003@gmail.com', 'anggoromukti18@gmail.com'].includes(user.email)) || (user as any).role === 'admin' ? "/admin" : "/user-profile") : "/login"} 
                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <UserIcon className="h-6 w-6" />
              </Link>
            ) : (
              <div className="p-2 text-transparent">
                <UserIcon className="h-6 w-6" />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
