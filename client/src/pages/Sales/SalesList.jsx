import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { salesAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

const statusColors = { completed: 'success', pending: 'warning', returned: 'danger', partially_returned: 'warning' };

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadSales(); }, [pagination.page]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await salesAPI.getAll({
        page: pagination.page, limit: 20, search,
        startDate: startDate || undefined, endDate: endDate || undefined,
      });
      setSales(res.data);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPagination(p=>({...p,page:1})); loadSales(); };

  const viewSale = async (id) => {
    try {
      const res = await salesAPI.getOne(id);
      setSelectedSale(res.data);
    } catch {}
  };

  const fmt = (v) => `₹${(v||0).toLocaleString('en-IN')}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Sales History</h1>
          <p className="text-surface-500 text-sm mt-0.5">{pagination.total} total sales</p>
        </div>
        <Button onClick={() => navigate('/create-bill')}>Create New Bill</Button>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <Input placeholder="Search invoice, customer..." value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} containerClass="flex-1 min-w-[200px]" />
          <Input type="date" label="From" value={startDate} onChange={(e) => setStartDate(e.target.value)} containerClass="w-40" />
          <Input type="date" label="To" value={endDate} onChange={(e) => setEndDate(e.target.value)} containerClass="w-40" />
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </Card>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-surface-500 border-b border-surface-100 bg-surface-50/50">
                <th className="px-6 py-3 font-medium">Invoice</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-center">Items</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium text-center">Payment</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(<tr key={i} className="border-b border-surface-50">{Array.from({length:8}).map((_,j)=>(<td key={j} className="px-6 py-4"><div className="skeleton h-4 w-full rounded"></div></td>))}</tr>))
              : sales.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-surface-500">No sales found</td></tr>
              ) : sales.map((s) => (
                <tr key={s._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary-600">{s.invoiceNumber}</td>
                  <td className="px-6 py-4 text-surface-700">{s.customerName}</td>
                  <td className="px-6 py-4 text-surface-500 text-xs">{fmtDate(s.createdAt)}</td>
                  <td className="px-6 py-4 text-center">{s.items?.length || 0}</td>
                  <td className="px-6 py-4 text-right font-semibold">{fmt(s.grandTotal)}</td>
                  <td className="px-6 py-4 text-center capitalize text-surface-600">{s.paymentMethod}</td>
                  <td className="px-6 py-4 text-center"><Badge color={statusColors[s.status]}>{s.status}</Badge></td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => viewSale(s._id)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={pagination.page<=1} onClick={()=>setPagination(p=>({...p,page:p.page-1}))}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={pagination.page>=pagination.pages} onClick={()=>setPagination(p=>({...p,page:p.page+1}))}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invoice Detail Modal */}
      <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title={`Invoice ${selectedSale?.invoiceNumber || ''}`} size="lg">
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-surface-500">Customer:</span> <strong>{selectedSale.customerName}</strong></div>
              <div><span className="text-surface-500">Phone:</span> {selectedSale.customerPhone || '—'}</div>
              <div><span className="text-surface-500">Date:</span> {fmtDate(selectedSale.createdAt)}</div>
              <div><span className="text-surface-500">Payment:</span> <span className="capitalize">{selectedSale.paymentMethod}</span></div>
            </div>
            <table className="w-full text-sm border-t border-surface-100">
              <thead><tr className="text-left text-surface-500"><th className="py-2">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Total</th></tr></thead>
              <tbody>
                {selectedSale.items.map((item, i) => (
                  <tr key={i} className="border-t border-surface-50">
                    <td className="py-2">{item.productName}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{fmt(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-surface-200 pt-3 space-y-1 text-sm text-right">
              <p>Subtotal: <strong>{fmt(selectedSale.subtotal)}</strong></p>
              {selectedSale.totalDiscount > 0 && <p className="text-danger-500">Discount: -{fmt(selectedSale.totalDiscount)}</p>}
              {selectedSale.totalTax > 0 && <p>Tax: +{fmt(selectedSale.totalTax)}</p>}
              <p className="text-lg font-bold text-surface-900">Grand Total: {fmt(selectedSale.grandTotal)}</p>
            </div>
            <div className="pt-4 flex justify-end">
              <Button 
                onClick={() => {
                  navigate(`/invoice/${selectedSale._id}`);
                  setSelectedSale(null);
                }}
              >
                View Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
