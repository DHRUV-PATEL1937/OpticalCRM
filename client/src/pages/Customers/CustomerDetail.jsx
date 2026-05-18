import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Glasses, Eye, ShoppingCart, Plus, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { customerAPI, prescriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editPrescription, setEditPrescription] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, presRes] = await Promise.all([
        customerAPI.getOne(id),
        prescriptionAPI.getByCustomer(id)
      ]);
      setCustomer(custRes.data);
      setPrescriptions(presRes.data);
    } catch (err) {
      toast.error('Failed to load customer details');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrescription = async (prescId) => {
    if (!window.confirm('Delete this prescription?')) return;
    try {
      await prescriptionAPI.delete(prescId);
      toast.success('Prescription deleted');
      loadData();
    } catch (err) { }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const fmtCurrency = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

  if (loading || !customer) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-surface-200 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-surface-200 rounded"></div><div className="h-4 bg-surface-200 rounded w-5/6"></div></div></div></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customers')} className="p-2 bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-surface-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{customer.name}</h1>
          <p className="text-surface-500 text-sm mt-0.5">Customer Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile */}
        <div className="space-y-6">
          <Card className="text-center relative">
            <Badge color={customer.category === 'vip' ? 'vip' : customer.category === 'premium' ? 'premium' : 'gray'} className="absolute top-4 right-4">
              {customer.category}
            </Badge>
            <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-4">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-surface-900">{customer.name}</h2>
            <p className="text-surface-500">{customer.phone}</p>
            {customer.email && <p className="text-surface-500 text-sm">{customer.email}</p>}

            <div className="mt-6 pt-6 border-t border-surface-100 grid grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-xs text-surface-400 font-medium">Total Spent</p>
                <p className="text-lg font-bold text-primary-600">{fmtCurrency(customer.totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400 font-medium">Total Purchases</p>
                <p className="text-lg font-bold text-surface-900">{customer.totalPurchases || 0}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-surface-100 text-left text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Date of Birth:</span>
                <span className="font-medium text-surface-900">{fmtDate(customer.dateOfBirth)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Last Visit:</span>
                <span className="font-medium text-surface-900">{fmtDate(customer.lastVisit)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Prescriptions & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prescriptions */}
          <Card padding={false}>
            <div className="p-6 border-b border-surface-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Glasses className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-bold text-surface-900">Eye Prescriptions</h3>
              </div>
              <Button size="sm" icon={Plus} onClick={() => { setEditPrescription(null); setShowPrescriptionForm(true); }}>Add Prescription</Button>
            </div>
            <div className="p-6 space-y-4">
              {prescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-surface-200 mx-auto mb-3" />
                  <p className="text-surface-500">No prescriptions found</p>
                </div>
              ) : (
                prescriptions.map(p => (
                  <div key={p._id} className="border border-surface-200 rounded-xl overflow-hidden hover:border-primary-300 transition-colors">
                    <div className="bg-surface-50 px-4 py-2 flex items-center justify-between border-b border-surface-200">
                      <p className="text-sm font-medium text-surface-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {fmtDate(p.createdAt)}
                        {p.doctorName && <span className="text-xs text-surface-500 ml-2 border-l border-surface-300 pl-2">Dr. {p.doctorName}</span>}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditPrescription(p); setShowPrescriptionForm(true); }} className="text-surface-400 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletePrescription(p._id)} className="text-surface-400 hover:text-danger-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Right Eye */}
                      <div className="bg-white border border-surface-100 rounded-lg p-3 shadow-sm">
                        <div className="text-xs font-bold text-primary-600 mb-2 pb-1 border-b border-surface-100 uppercase tracking-wider">Right Eye (OD)</div>
                        <div className="grid grid-cols-4 gap-2 text-center text-sm">
                          <div><p className="text-[10px] text-surface-400 uppercase">SPH</p><p className="font-medium">{p.rightEye?.sph || '-'}</p></div>
                          <div><p className="text-[10px] text-surface-400 uppercase">CYL</p><p className="font-medium">{p.rightEye?.cyl || '-'}</p></div>
                          <div><p className="text-[10px] text-surface-400 uppercase">AXIS</p><p className="font-medium">{p.rightEye?.axis || '-'}</p></div>
                          <div><p className="text-[10px] text-surface-400 uppercase">ADD</p><p className="font-medium">{p.rightEye?.add || '-'}</p></div>
                        </div>
                      </div>
                      {/* Left Eye */}
                      <div className="bg-white border border-surface-100 rounded-lg p-3 shadow-sm">
                        <div className="text-xs font-bold text-primary-600 mb-2 pb-1 border-b border-surface-100 uppercase tracking-wider">Left Eye (OS)</div>
                        <div className="grid grid-cols-4 gap-2 text-center text-sm">
                          <div><p className="text-[10px] text-surface-400 uppercase">SPH</p><p className="font-medium">{p.leftEye?.sph || '-'}</p></div>
                          <div><p className="text-[10px] text-surface-400 uppercase">CYL</p><p className="font-medium">{p.leftEye?.cyl || '-'}</p></div>
                          <div><p className="text-[10px] text-surface-400 uppercase">AXIS</p><p className="font-medium">{p.leftEye?.axis || '-'}</p></div>
                          <div><p className="text-[10px] text-surface-400 uppercase">ADD</p><p className="font-medium">{p.leftEye?.add || '-'}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Purchase History */}
          <Card padding={false}>
            <div className="p-6 border-b border-surface-100 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-surface-500" />
              <h3 className="text-lg font-bold text-surface-900">Purchase History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-surface-500 bg-surface-50/50">
                    <th className="px-6 py-3 font-medium">Invoice</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.purchases?.length === 0 ? (
                     <tr><td colSpan={4} className="text-center py-6 text-surface-400">No purchases yet</td></tr>
                  ) : (
                    customer.purchases?.map(sale => (
                      <tr key={sale._id} className="border-t border-surface-50">
                        <td className="px-6 py-3 font-medium text-primary-600 cursor-pointer" onClick={() => navigate('/sales')}>{sale.invoiceNumber}</td>
                        <td className="px-6 py-3 text-surface-600">{fmtDate(sale.createdAt)}</td>
                        <td className="px-6 py-3 text-right font-semibold">{fmtCurrency(sale.grandTotal)}</td>
                        <td className="px-6 py-3 text-center"><Badge color={sale.status === 'completed' ? 'success' : 'warning'}>{sale.status}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Prescription Modal */}
      <Modal isOpen={showPrescriptionForm} onClose={() => setShowPrescriptionForm(false)} title={editPrescription ? "Edit Prescription" : "Add Eye Prescription"} size="lg">
        <PrescriptionForm customerId={id} prescription={editPrescription} onClose={(saved) => { setShowPrescriptionForm(false); if (saved) loadData(); }} />
      </Modal>
    </div>
  );
}

function PrescriptionForm({ customerId, prescription, onClose }) {
  const [form, setForm] = useState({
    rightEye: { sph: prescription?.rightEye?.sph || '', cyl: prescription?.rightEye?.cyl || '', axis: prescription?.rightEye?.axis || '', add: prescription?.rightEye?.add || '', va: prescription?.rightEye?.va || '' },
    leftEye: { sph: prescription?.leftEye?.sph || '', cyl: prescription?.leftEye?.cyl || '', axis: prescription?.leftEye?.axis || '', add: prescription?.leftEye?.add || '', va: prescription?.leftEye?.va || '' },
    pd: prescription?.pd || '',
    doctorName: prescription?.doctorName || '',
    notes: prescription?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleEyeChange = (eye, field) => (e) => {
    setForm(prev => ({ ...prev, [eye]: { ...prev[eye], [field]: e.target.value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (prescription) {
        await prescriptionAPI.update(prescription._id, form);
        toast.success('Prescription updated');
      } else {
        await prescriptionAPI.create({ ...form, customer: customerId });
        toast.success('Prescription added');
      }
      onClose(true);
    } catch (err) { }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right Eye */}
        <div className="space-y-4 border border-surface-200 rounded-xl p-4 bg-surface-50/50">
          <h4 className="font-bold text-primary-600 text-center border-b border-surface-200 pb-2">Right Eye (OD)</h4>
          <div className="grid grid-cols-2 gap-3">
            <Input label="SPH" placeholder="-1.00" value={form.rightEye.sph} onChange={handleEyeChange('rightEye', 'sph')} />
            <Input label="CYL" placeholder="-0.50" value={form.rightEye.cyl} onChange={handleEyeChange('rightEye', 'cyl')} />
            <Input label="AXIS" placeholder="90" value={form.rightEye.axis} onChange={handleEyeChange('rightEye', 'axis')} />
            <Input label="ADD" placeholder="+2.00" value={form.rightEye.add} onChange={handleEyeChange('rightEye', 'add')} />
          </div>
        </div>
        {/* Left Eye */}
        <div className="space-y-4 border border-surface-200 rounded-xl p-4 bg-surface-50/50">
          <h4 className="font-bold text-primary-600 text-center border-b border-surface-200 pb-2">Left Eye (OS)</h4>
          <div className="grid grid-cols-2 gap-3">
            <Input label="SPH" placeholder="-1.00" value={form.leftEye.sph} onChange={handleEyeChange('leftEye', 'sph')} />
            <Input label="CYL" placeholder="-0.50" value={form.leftEye.cyl} onChange={handleEyeChange('leftEye', 'cyl')} />
            <Input label="AXIS" placeholder="90" value={form.leftEye.axis} onChange={handleEyeChange('leftEye', 'axis')} />
            <Input label="ADD" placeholder="+2.00" value={form.leftEye.add} onChange={handleEyeChange('leftEye', 'add')} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Input label="PD (Pupillary Distance)" placeholder="62mm" value={form.pd} onChange={e => setForm({...form, pd: e.target.value})} />
        <Input label="Doctor Name" placeholder="Dr. Smith" value={form.doctorName} onChange={e => setForm({...form, doctorName: e.target.value})} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="button" variant="secondary" onClick={() => onClose(false)}>Cancel</Button>
        <Button type="submit" loading={loading}>{prescription ? 'Update' : 'Save Prescription'}</Button>
      </div>
    </form>
  );
}
