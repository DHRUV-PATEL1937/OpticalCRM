import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Phone, Mail, Edit, Trash2, Star } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { customerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const categoryColors = { regular: 'gray', premium: 'premium', vip: 'vip' };

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  useEffect(() => { loadCustomers(); }, [pagination.page, category]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerAPI.getAll({ page: pagination.page, limit: 20, search, category: category || undefined });
      setCustomers(res.data);
      setPagination(res.pagination);
    } catch (err) { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPagination(p => ({...p, page: 1})); loadCustomers(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this customer?')) return;
    try { await customerAPI.delete(id); toast.success('Customer removed'); loadCustomers(); } catch {}
  };

  const handleSave = async (data) => {
    try {
      if (editCustomer) { await customerAPI.update(editCustomer._id, data); toast.success('Customer updated!'); }
      else { await customerAPI.create(data); toast.success('Customer created!'); }
      setShowForm(false); setEditCustomer(null); loadCustomers();
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Customers</h1>
          <p className="text-surface-500 text-sm mt-0.5">{pagination.total} customers</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditCustomer(null); setShowForm(true); }}>Add Customer</Button>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <Input placeholder="Search by name, phone..." value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} containerClass="flex-1 min-w-[200px]" />
          <Select options={[{value:'regular',label:'Regular'},{value:'premium',label:'Premium'},{value:'vip',label:'VIP'}]} value={category} onChange={(e) => { setCategory(e.target.value); setPagination(p=>({...p,page:1})); }} placeholder="All Categories" containerClass="w-44" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </Card>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-surface-500 border-b border-surface-100 bg-surface-50/50">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium text-right">Total Spent</th>
                <th className="px-6 py-3 font-medium text-center">Purchases</th>
                <th className="px-6 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(<tr key={i} className="border-b border-surface-50">{Array.from({length:6}).map((_,j)=>(<td key={j} className="px-6 py-4"><div className="skeleton h-4 w-full rounded"></div></td>))}</tr>))
              : customers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12"><Users className="w-12 h-12 text-surface-300 mx-auto mb-3" /><p className="text-surface-500">No customers found</p></td></tr>
              ) : customers.map((c) => (
                <tr key={c._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/customers/${c._id}`)}>
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-600 group-hover:bg-primary-200 transition-colors">{c.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-surface-900 group-hover:text-primary-600 transition-colors">{c.name}</p>
                        {c.email && <p className="text-xs text-surface-400">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-surface-600">{c.phone}</td>
                  <td className="px-6 py-4"><Badge color={categoryColors[c.category]}>{c.category}</Badge></td>
                  <td className="px-6 py-4 text-right font-semibold">₹{(c.totalSpent || 0).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-center text-surface-600">{c.totalPurchases || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => navigate(`/customers/${c._id}`)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors cursor-pointer" title="View Profile"><Star className="w-4 h-4" /></button>
                      <button onClick={() => { setEditCustomer(c); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors cursor-pointer" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-danger-500 transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
              <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination(p=>({...p,page:p.page-1}))}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p=>({...p,page:p.page+1}))}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Customer Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditCustomer(null); }} title={editCustomer ? 'Edit Customer' : 'Add Customer'} size="md">
        <CustomerForm customer={editCustomer} onSave={handleSave} onCancel={() => { setShowForm(false); setEditCustomer(null); }} />
      </Modal>
    </div>
  );
}

function CustomerForm({ customer, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: customer?.name || '', phone: customer?.phone || '', email: customer?.email || '',
    gender: customer?.gender || '', category: customer?.category || 'regular',
    dateOfBirth: customer?.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
    address: { city: customer?.address?.city || '', state: customer?.address?.state || '', pincode: customer?.address?.pincode || '' },
    notes: customer?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const h = (f) => (e) => setForm({...form, [f]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Name *" placeholder="Customer name" value={form.name} onChange={h('name')} />
        <Input label="Phone *" placeholder="9876543210" value={form.phone} onChange={h('phone')} />
        <Input label="Email" placeholder="email@example.com" type="email" value={form.email} onChange={h('email')} />
        <Select label="Gender" options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]} value={form.gender} onChange={h('gender')} />
        <Select label="Category" options={[{value:'regular',label:'Regular'},{value:'premium',label:'Premium'},{value:'vip',label:'VIP'}]} value={form.category} onChange={h('category')} />
        <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={h('dateOfBirth')} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="City" value={form.address.city} onChange={(e) => setForm({...form, address: {...form.address, city: e.target.value}})} />
        <Input label="State" value={form.address.state} onChange={(e) => setForm({...form, address: {...form.address, state: e.target.value}})} />
        <Input label="Pincode" value={form.address.pincode} onChange={(e) => setForm({...form, address: {...form.address, pincode: e.target.value}})} />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-100">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{customer ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
