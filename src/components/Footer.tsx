import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-green-900 text-green-50 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <a href="https://wa.me/6282121615613" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-200 text-sm hover:text-white transition-colors">
              <Phone className="h-4 w-4" />
              <span>+62 821-2161-5613</span>
            </a>
            <a href="mailto:anggoromukti18@gmail.com" className="flex items-center gap-2 text-green-200 text-sm hover:text-white transition-colors">
              <Mail className="h-4 w-4" />
              <span>anggoromukti18@gmail.com</span>
            </a>
            <a href="https://maps.app.goo.gl/Zr5vgo1PWSU9HrFV7?g_st=com.google.maps.preview.copy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-200 text-sm hover:text-white transition-colors">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Lokasi Kami</span>
            </a>
          </div>
          <div className="text-green-400 text-sm text-center md:text-right border-t md:border-t-0 border-green-800 pt-4 md:pt-0 w-full md:w-auto mt-2 md:mt-0">
            <p>&copy; {new Date().getFullYear()} SidoMukti.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
