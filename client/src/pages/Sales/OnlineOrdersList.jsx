import { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, Package, Truck, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function OnlineOrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shop/orders');
      setOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/shop/orders/${id}/status`, { status: newStatus });
      toast.success('Order status updated');
      loadOrders();
    } catch { toast.error('Failed to update status'); }
  };

  const statusColors = {
    pending: 'warning',
    processing: 'primary',
    shipped: 'premium',
    delivered: 'success',
    cancelled: 'danger'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Online Orders</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage and fulfill orders from your website</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center text-warning-600"><Clock className="w-6 h-6" /></div>
          <div><p className="text-sm text-surface-500 font-medium">Pending</p><p className="text-2xl font-bold">{orders.filter(o=>o.status==='pending').length}</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600"><Package className="w-6 h-6" /></div>
          <div><p className="text-sm text-surface-500 font-medium">Processing</p><p className="text-2xl font-bold">{orders.filter(o=>o.status==='processing').length}</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center text-success-600"><CheckCircle className="w-6 h-6" /></div>
          <div><p className="text-sm text-surface-500 font-medium">Delivered</p><p className="text-2xl font-bold">{orders.filter(o=>o.status==='delivered').length}</p></div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-surface-500 border-b border-surface-100 bg-surface-50/50">
                <th className="px-6 py-4 font-medium">Order Details</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium text-center">Items</th>
                <th className="px-6 py-4 font-medium text-right">Total</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-surface-500">No online orders yet.</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="border-b border-surface-50 hover:bg-surface-50/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-surface-900">{order.orderNumber}</p>
                    <p className="text-xs text-surface-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-surface-900 font-medium">{order.customerName}</p>
                    <p className="text-xs text-surface-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-surface-600 font-medium">{order.items.reduce((a,b)=>a+b.quantity, 0)}</td>
                  <td className="px-6 py-4 text-right font-bold text-surface-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge color={statusColors[order.status]}>{order.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Select 
                      value={order.status} 
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'processing', label: 'Processing' },
                        { value: 'shipped', label: 'Shipped' },
                        { value: 'delivered', label: 'Delivered' },
                        { value: 'cancelled', label: 'Cancelled' }
                      ]}
                      containerClass="min-w-[120px]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
