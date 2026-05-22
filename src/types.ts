export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  createdAt: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  userEmail?: string;
  customerName?: string; // Legacy
  namaLengkap?: string;
  address?: string; // Legacy
  alamatLengkap?: string;
  phone?: string; // Legacy
  nomorHP?: string;
  paymentMethod?: 'COD' | 'Transfer'; // Legacy
  deliveryMethod?: 'pickup' | 'delivery'; // Legacy
  metodePengiriman?: 'Ambil di Toko' | 'Dikirim';
  items: CartItem[];
  totalPrice?: number; // Legacy
  total?: number;
  status: 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  createdAt: any;
  read?: boolean;
}

export interface ChatMessage {
  id?: string;
  sender: 'buyer' | 'admin';
  text: string;
  createdAt: number;
  sessionId: string; 
}
