import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function Shop({ onOpenCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadProducts(); }, [search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shop/products', { params: { search, limit: 50 } });
      setProducts(res.data);
    } catch { toast.error('Failed to load shop items'); }
    finally { setLoading(false); }
  };

  const addToCart = (product) => {
    const existingCart = JSON.parse(localStorage.getItem('publicCart') || '[]');
    const existingItem = existingCart.find(i => i.product === product._id);
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast.error('Cannot add more than available stock');
        return;
      }
      existingItem.quantity += 1;
    } else {
      existingCart.push({
        product: product._id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        image: product.images?.[0]
      });
    }
    localStorage.setItem('publicCart', JSON.stringify(existingCart));
    toast.success(`${product.name} added to cart`);
    
    // Dispatch custom event to notify layout header
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-surface-900 tracking-tight mb-4">
          Discover Your Perfect Vision
        </h1>
        <p className="text-lg text-surface-600 max-w-2xl mx-auto">
          Browse our exclusive collection of premium frames, sunglasses, and high-quality lenses.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <Input 
          placeholder="Search by name or brand..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          icon={Search} 
          containerClass="w-full md:w-96" 
        />
        <Button variant="secondary" icon={Filter}>Filters</Button>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl p-4 shadow-sm h-80 border border-surface-100">
              <div className="w-full h-48 bg-surface-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-surface-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-surface-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-surface-100 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-surface-900 mb-2">No products found</h3>
          <p className="text-surface-500">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <div key={product._id} className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-surface-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group flex flex-col">
              <div className="relative aspect-square bg-surface-50 flex items-center justify-center p-6 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img src={`http://localhost:5000${product.images[0]}`} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-surface-100 rounded-xl flex items-center justify-center">
                    <span className="text-surface-400 font-medium tracking-widest text-xs uppercase">{product.brand || 'Optical'}</span>
                  </div>
                )}
                {product.stockQuantity < 5 && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-danger-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                    Only {product.stockQuantity} Left
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="mb-1 text-xs font-semibold text-primary-600 tracking-wider uppercase">{product.category.replace('_', ' ')}</div>
                <h3 className="font-bold text-surface-900 text-lg mb-1 leading-tight group-hover:text-primary-600 transition-colors">{product.name}</h3>
                {product.brand && <p className="text-sm text-surface-500 mb-4">{product.brand}</p>}
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="font-extrabold text-xl text-surface-900">₹{product.sellingPrice.toLocaleString('en-IN')}</div>
                  <Button size="sm" onClick={() => addToCart(product)} className="shadow-md shadow-primary-500/20">Add to Cart</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
