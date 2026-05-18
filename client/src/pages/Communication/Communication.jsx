import { useState, useRef, useEffect } from 'react';
import { Upload, MessageCircle, Send, FileSpreadsheet, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Communication() {
  const [file, setFile] = useState(null);
  const [template, setTemplate] = useState('promotional_offer');
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get('/messages?limit=20');
      setMessages(data);
    } catch (err) {
      // silent fail for polling
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select an Excel file');
    if (!template) return toast.error('Please enter a template name');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateName', template);

    setUploading(true);
    try {
      const res = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const statusConfig = {
    queued: { icon: Clock, color: 'warning', text: 'Queued' },
    sent: { icon: CheckCircle2, color: 'success', text: 'Sent' },
    failed: { icon: XCircle, color: 'danger', text: 'Failed' },
    pending: { icon: Clock, color: 'surface', text: 'Pending' }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Communication Center</h1>
          <p className="text-sm text-surface-500 mt-1">Send bulk WhatsApp and SMS messages to customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <Card className="lg:col-span-1 space-y-6">
          <CardHeader><CardTitle>New Campaign</CardTitle></CardHeader>
          
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Meta Template Name</label>
            <Input 
              value={template} 
              onChange={(e) => setTemplate(e.target.value)} 
              placeholder="e.g. eye_exam_reminder"
            />
            <p className="text-xs text-surface-500 mt-1">Must exactly match your approved WhatsApp template name.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Contacts File (Excel)</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                file ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-primary-400 bg-surface-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden" 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                {file ? (
                  <>
                    <FileSpreadsheet className="w-8 h-8 text-primary-500 mb-2" />
                    <span className="text-sm font-medium text-primary-700">{file.name}</span>
                    <span className="text-xs text-primary-500 mt-1">Click to change</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-surface-400 mb-2" />
                    <span className="text-sm font-medium text-surface-700">Click to upload Excel file</span>
                    <span className="text-xs text-surface-500 mt-1">Required columns: Phone, Name</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <Button onClick={handleUpload} loading={uploading} icon={Send} className="w-full">
            Start Campaign
          </Button>
        </Card>

        {/* Status Tracker */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent Messages Status</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-surface-500 border-b border-surface-100 bg-surface-50/50">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Template</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-surface-500">No messages found</td></tr>
                ) : (
                  messages.map(msg => {
                    const StatusIcon = statusConfig[msg.status || 'pending'].icon;
                    return (
                      <tr key={msg._id} className="border-b border-surface-50">
                        <td className="px-4 py-3 font-medium text-surface-900">{msg.customerName}</td>
                        <td className="px-4 py-3 text-surface-600">{msg.phoneNumber}</td>
                        <td className="px-4 py-3 text-surface-500">{msg.templateName}</td>
                        <td className="px-4 py-3">
                          <Badge color={statusConfig[msg.status || 'pending'].color} className="flex items-center gap-1 w-max">
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[msg.status || 'pending'].text}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-surface-500 text-xs">
                          {new Date(msg.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
