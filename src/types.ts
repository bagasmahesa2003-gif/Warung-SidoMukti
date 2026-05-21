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
  customerName: string;
  address: string;
  phone: string;
  paymentMethod: 'COD' | 'Transfer';
  deliveryMethod?: 'pickup' | 'delivery';
  items: CartItem[];
  totalPrice: number;
  status: 'diproses' | 'dikirim' | 'selesai';
  createdAt: number;
  read?: boolean;
}

export interface ChatMessage {
  id?: string;
  sender: 'buyer' | 'admin';
  text: string;
  createdAt: number;
  sessionId: string; 
}
