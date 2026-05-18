import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('publicCart') || '[]');
    setCart(savedCart);
    if (savedCart.length === 0 && !success) {
      toast.error('Your cart is empty');
      navigate('/shop');
    }
  }, [navigate, success]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const total = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        shippingAddress: {
          addressLine: form.addressLine,
          city: form.city,
          state: form.state,
          pincode: form.pincode
        },
        items: cart,
        totalAmount: total
      };

      await api.post('/shop/checkout', payload);
      localStorage.removeItem('publicCart');
      window.dispatchEvent(new Event('cartUpdated'));
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12 text-success-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-surface-900 mb-4">Order Placed Successfully!</h1>
        <p className="text-lg text-surface-600 mb-8">
          Thank you for your order. We will process it shortly and notify you of the shipping details. Pay using Cash on Delivery when it arrives.
        </p>
        <Button onClick={() => navigate('/shop')} size="lg">Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <h1 className="text-3xl font-bold text-surface-900 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-surface-100">
            <div>
              <h2 className="text-xl font-bold text-surface-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name *" value={form.customerName} onChange={handleChange('customerName')} required />
                <Input label="Phone Number *" type="tel" value={form.customerPhone} onChange={handleChange('customerPhone')} required />
                <Input label="Email Address" type="email" value={form.customerEmail} onChange={handleChange('customerEmail')} containerClass="md:col-span-2" />
              </div>
            </div>

            <div className="pt-6 border-t border-surface-100">
              <h2 className="text-xl font-bold text-surface-900 mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Address Line 1 *" value={form.addressLine} onChange={handleChange('addressLine')} required containerClass="md:col-span-2" />
                <Input label="City *" value={form.city} onChange={handleChange('city')} required />
                <Input label="State *" value={form.state} onChange={handleChange('state')} required />
                <Input label="Pincode / ZIP *" value={form.pincode} onChange={handleChange('pincode')} required />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full text-lg py-4 shadow-lg shadow-primary-500/25">Place Order (COD)</Button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-surface-50 rounded-3xl p-8 sticky top-8">
            <h2 className="text-xl font-bold text-surface-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-16 h-16 bg-white rounded-lg border border-surface-200 overflow-hidden flex-shrink-0">
                    {item.image && <img src={`http://localhost:5000${item.image}`} alt={item.productName} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-surface-900 text-sm">{item.productName}</h4>
                    <p className="text-surface-500 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-medium text-surface-900">₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-surface-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-surface-600">Subtotal</span>
                <span className="font-medium">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-surface-600">Shipping</span>
                <span className="text-success-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-surface-200">
                <span className="text-lg font-bold text-surface-900">Total</span>
                <span className="text-2xl font-extrabold text-primary-600">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
