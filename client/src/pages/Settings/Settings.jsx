import { useState, useEffect } from 'react';
import { Save, Store, Mail, FileText, Percent, Shield } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'general', label: 'General Info', icon: Store },
  { id: 'sales', label: 'Sales & Tax', icon: Percent },
  { id: 'pdf', label: 'PDF Templates', icon: FileText },
  { id: 'communication', label: 'WhatsApp / SMS', icon: Mail },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    general: { storeName: '', phone: '', address: '', email: '', currency: 'INR' },
    sales: { defaultTax: '18', invoicePrefix: 'INV-', glassTypes: [] },
    pdf: { termsAndConditions: '', footerText: '' },
    communication: { whatsappApiKey: '', smsProvider: '' }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      // Merge fetched settings into state
      setSettings(prev => {
        const merged = { ...prev };
        Object.keys(data).forEach(category => {
          if (merged[category]) {
            merged[category] = { ...merged[category], ...data[category] };
          }
        });
        return merged;
      });
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleAddGlassType = () => {
    const current = settings.sales.glassTypes || [];
    handleChange('sales', 'glassTypes', [...current, { id: Date.now().toString(), name: '', price: 0 }]);
  };

  const handleUpdateGlassType = (id, field, value) => {
    const current = settings.sales.glassTypes || [];
    handleChange('sales', 'glassTypes', current.map(g => g.id === id ? { ...g, [field]: field === 'price' ? Number(value) : value } : g));
  };

  const handleRemoveGlassType = (id) => {
    const current = settings.sales.glassTypes || [];
    handleChange('sales', 'glassTypes', current.filter(g => g.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Flatten settings for API
      const payload = [];
      Object.keys(settings).forEach(category => {
        Object.keys(settings[category]).forEach(key => {
          payload.push({ category, key, value: settings[category][key] });
        });
      });

      await api.post('/settings', { settings: payload });
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Master Settings</h1>
          <p className="text-sm text-surface-500 mt-1">Configure your OpticalCRM parameters</p>
        </div>
        <Button onClick={handleSave} loading={saving} icon={Save}>Save Changes</Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <Card className="w-full lg:w-64 flex-shrink-0 p-2" padding={false}>
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary-600' : 'text-surface-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <Card className="flex-1 min-h-[400px]">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fadeIn">
              <CardHeader><CardTitle>General Store Information</CardTitle></CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Store Name" value={settings.general.storeName || ''} onChange={(e) => handleChange('general', 'storeName', e.target.value)} />
                <Input label="Store Email" type="email" value={settings.general.email || ''} onChange={(e) => handleChange('general', 'email', e.target.value)} />
                <Input label="Store Phone" value={settings.general.phone || ''} onChange={(e) => handleChange('general', 'phone', e.target.value)} />
                <Input label="Currency (e.g. INR, USD)" value={settings.general.currency || ''} onChange={(e) => handleChange('general', 'currency', e.target.value)} />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Store Address</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
                    value={settings.general.address || ''}
                    onChange={(e) => handleChange('general', 'address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-6 animate-fadeIn">
              <CardHeader><CardTitle>Sales & Tax Configuration</CardTitle></CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Default Tax (%)" type="number" value={settings.sales.defaultTax || ''} onChange={(e) => handleChange('sales', 'defaultTax', e.target.value)} />
                <Input label="Invoice Prefix" value={settings.sales.invoicePrefix || ''} onChange={(e) => handleChange('sales', 'invoicePrefix', e.target.value)} />
              </div>

              <div className="pt-6 border-t border-surface-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-surface-900">Glass / Lens Types</h3>
                    <p className="text-sm text-surface-500">Configure lens options and prices to use during bill creation</p>
                  </div>
                  <Button onClick={handleAddGlassType} size="sm" variant="secondary">Add Glass Type</Button>
                </div>
                
                <div className="space-y-3">
                  {(settings.sales.glassTypes || []).length === 0 ? (
                    <p className="text-sm text-surface-400 py-4 text-center border border-dashed border-surface-200 rounded-xl">No glass types added yet.</p>
                  ) : (
                    (settings.sales.glassTypes || []).map((glass) => (
                      <div key={glass.id} className="flex items-center gap-3 bg-surface-50 p-3 rounded-xl border border-surface-100">
                        <div className="flex-1">
                          <Input placeholder="Glass Name (e.g., ARC, Blue Cut)" value={glass.name} onChange={(e) => handleUpdateGlassType(glass.id, 'name', e.target.value)} />
                        </div>
                        <div className="w-32">
                          <Input type="number" placeholder="Price" value={glass.price} onChange={(e) => handleUpdateGlassType(glass.id, 'price', e.target.value)} />
                        </div>
                        <button onClick={() => handleRemoveGlassType(glass.id)} className="p-2.5 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer self-end mb-1">
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="space-y-6 animate-fadeIn">
              <CardHeader><CardTitle>PDF Generation Settings</CardTitle></CardHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Terms & Conditions (Printed on Invoice)</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
                    value={settings.pdf.termsAndConditions || ''}
                    onChange={(e) => handleChange('pdf', 'termsAndConditions', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Footer Text</label>
                  <Input value={settings.pdf.footerText || ''} onChange={(e) => handleChange('pdf', 'footerText', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="space-y-6 animate-fadeIn">
              <CardHeader><CardTitle>Communication API Keys</CardTitle></CardHeader>
              <div className="grid grid-cols-1 gap-6">
                <Input label="WhatsApp Cloud API Key" type="password" value={settings.communication.whatsappApiKey || ''} onChange={(e) => handleChange('communication', 'whatsappApiKey', e.target.value)} />
                <Input label="SMS Provider API Key" type="password" value={settings.communication.smsProvider || ''} onChange={(e) => handleChange('communication', 'smsProvider', e.target.value)} />
                <p className="text-sm text-surface-500">Note: Keep these keys secure. They are used for automated messaging.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
