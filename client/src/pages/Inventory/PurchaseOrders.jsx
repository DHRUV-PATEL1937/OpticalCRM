import { useState, useEffect } from 'react';
import { Plus, Filter, Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { inventoryAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPOs(); }, []);

  const loadPOs = async () => {
    try {
      setLoading(true);
      const res = await inventoryAPI.getPurchaseOrders();
      setPos(res.data);
    } catch { toast.error('Failed to load purchase orders'); }
    finally { setLoading(false); }
  };

  const statusColors = {
    draft: 'gray',
    ordered: 'warning',
    partially_received: 'primary',
    received: 'success'
  };

  const handleReceive = async (poId, itemsToReceive) => {
    try {
      await inventoryAPI.receivePurchaseOrder(poId, { itemsToReceive });
      toast.success('Inventory received successfully');
      loadPOs();
    } catch {
      toast.error('Failed to receive inventory');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Purchase Orders</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage stock orders from suppliers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Filter}>Filter</Button>
          <Button icon={Plus}>Create PO</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-600"><Clock className="w-6 h-6" /></div>
          <div><p className="text-sm text-surface-500 font-medium">Pending</p><p className="text-2xl font-bold">{pos.filter(p=>p.status==='ordered').length}</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600"><Truck className="w-6 h-6" /></div>
          <div><p className="text-sm text-surface-500 font-medium">Partial</p><p className="text-2xl font-bold">{pos.filter(p=>p.status==='partially_received').length}</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center text-success-600"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-sm text-surface-500 font-medium">Received</p><p className="text-2xl font-bold">{pos.filter(p=>p.status==='received').length}</p></div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-surface-500 border-b border-surface-100 bg-surface-50/50">
                <th className="px-6 py-4 font-medium">PO Number</th>
                <th className="px-6 py-4 font-medium">Supplier</th>
                <th className="px-6 py-4 font-medium">Items</th>
                <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
              ) : pos.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-surface-500">No purchase orders found.</td></tr>
              ) : pos.map((po) => (
                <tr key={po._id} className="border-b border-surface-50 hover:bg-surface-50/50">
                  <td className="px-6 py-4 font-medium text-surface-900">{po.poNumber}</td>
                  <td className="px-6 py-4">{po.supplier?.name || 'Unknown Supplier'}</td>
                  <td className="px-6 py-4 text-surface-500">{po.items.length} items</td>
                  <td className="px-6 py-4 text-right font-semibold">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge color={statusColors[po.status] || 'gray'}>{po.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {po.status !== 'received' && (
                       <Button size="sm" variant="secondary" onClick={() => {
                          const itemsToReceive = po.items.map(i => ({ productId: i.product, qty: i.requestedQty - i.receivedQty })).filter(i => i.qty > 0);
                          if(confirm(`Receive all remaining items for ${po.poNumber}?`)) handleReceive(po._id, itemsToReceive);
                       }}>Receive All</Button>
                    )}
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
