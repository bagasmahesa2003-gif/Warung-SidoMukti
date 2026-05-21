import { Product, Order } from '../types';

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Tomat Segar', price: 15000, stock: 50, category: 'Sayuran Buah', imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', createdAt: Date.now() },
  { id: '2', name: 'Wortel Lokal', price: 12000, stock: 30, category: 'Umbi', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80', createdAt: Date.now() },
  { id: '3', name: 'Bayam Hijau', price: 5000, stock: 0, category: 'Daun', imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80', createdAt: Date.now() },
];

export const getMockProducts = (): Product[] => {
  const stored = localStorage.getItem('sidomukti_products');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('sidomukti_products', JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
};

export const getMockOrders = (): Order[] => {
  const stored = localStorage.getItem('sidomukti_orders');
  if (stored) return JSON.parse(stored);
  return [];
};

export const reduceMockProductStock = (productId: string, quantity: number) => {
  const products = getMockProducts();
  const index = products.findIndex(p => p.id === productId);
  if (index >= 0) {
    products[index].stock = Math.max(0, products[index].stock - quantity);
    localStorage.setItem('sidomukti_products', JSON.stringify(products));
    window.dispatchEvent(new Event('mock_data_updated'));
  }
};

export const saveMockProduct = (product: Product) => {
  const products = getMockProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.push(product);
  }
  localStorage.setItem('sidomukti_products', JSON.stringify(products));
  window.dispatchEvent(new Event('mock_data_updated'));
};

export const deleteMockProduct = (id: string) => {
  const products = getMockProducts().filter(p => p.id !== id);
  localStorage.setItem('sidomukti_products', JSON.stringify(products));
  window.dispatchEvent(new Event('mock_data_updated'));
};

export const addMockOrder = (order: Order) => {
  const orders = getMockOrders();
  orders.push(order);
  localStorage.setItem('sidomukti_orders', JSON.stringify(orders));
  window.dispatchEvent(new Event('mock_data_updated'));
};

export const updateMockOrderStatus = (id: string, status: string) => {
  const orders = getMockOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index >= 0) {
    orders[index].status = status as any;
    localStorage.setItem('sidomukti_orders', JSON.stringify(orders));
    window.dispatchEvent(new Event('mock_data_updated'));
  }
};
