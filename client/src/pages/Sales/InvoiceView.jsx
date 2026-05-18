import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Printer, ArrowLeft, MessageCircle, Copy } from 'lucide-react';
import Button from '../../components/ui/Button';
import { salesAPI } from '../../services/api';
import api from '../../services/api';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  useEffect(() => {
    loadInvoiceData();
  }, [id]);

  const loadInvoiceData = async () => {
    try {
      const [saleRes, settingsRes] = await Promise.all([
        salesAPI.getOne(id),
        api.get('/settings')
      ]);
      setSale(saleRes.data);
      setSettings(settingsRes.data || settingsRes); // handle depending on interceptor
    } catch (err) {
      toast.error('Failed to load invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!sale) return;
    try {
      generateInvoicePDF(sale, settings);
      toast.success('PDF Downloaded successfully');
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppLink = () => {
    const phone = sale.customer?.phone || sale.customerPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const shopName = settings?.general?.storeName || process.env.SHOP_NAME || 'our store';
    const invoiceUrl = `${window.location.origin}/bill/${sale._id}`;
    const message = `Dear ${sale.customer?.name || sale.customerName || 'Customer'},\n\nThank you for your purchase at *${shopName}*!\n\nYour invoice *#${settings?.sales?.invoicePrefix || 'INV-'}${sale.invoiceNumber}* for *₹${sale.grandTotal.toLocaleString('en-IN')}* is ready.\n\nView & Download your bill here:\n${invoiceUrl}\n\nRegards,\n*${shopName}*`;
    const waUrl = isMobile 
      ? `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}` 
      : `https://web.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
    return { url: waUrl, message, phone: fullPhone };
  };

  if (loading) return <div className="p-8 text-center text-surface-500">Loading invoice...</div>;
  if (!sale) return <div className="p-8 text-center text-danger-500">Invoice not found.</div>;

  const currency = settings?.general?.currency || 'INR';
  const fmt = (v) => `${currency} ${(v||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const customerPhone = sale.customer?.phone || sale.customerPhone;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fadeIn">
      {/* Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={ArrowLeft}>
          Back to Sales
        </Button>
        <div className="flex gap-3">
          {customerPhone && (
            <button
              onClick={() => setShowWhatsApp(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl font-medium transition-colors shadow-md hover:shadow-lg"
            >
              <MessageCircle className="w-4 h-4" /> Share via WhatsApp
            </button>
          )}
          <Button variant="secondary" onClick={handlePrint} icon={Printer}>
            Print Invoice
          </Button>
          <Button onClick={handleDownload} icon={Download}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {showWhatsApp && (() => {
        const wa = getWhatsAppLink();
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setShowWhatsApp(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-900">Send Invoice via WhatsApp</h3>
                  <p className="text-xs text-surface-500">To: +{wa.phone}</p>
                </div>
              </div>
              <div className="bg-surface-50 rounded-xl p-4 mb-4 text-sm text-surface-700 whitespace-pre-wrap border border-surface-200 max-h-64 overflow-y-auto">
                {wa.message}
              </div>
              <div className="flex gap-3 justify-end flex-wrap mt-4">
                <button onClick={() => setShowWhatsApp(false)} className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-800 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(wa.message);
                    toast.success('Message copied to clipboard');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copy Message
                </button>
                <a
                  href={wa.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowWhatsApp(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl font-medium transition-colors shadow-md"
                >
                  <MessageCircle className="w-4 h-4" /> Send on WhatsApp
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* A4 Paper Container */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden print:shadow-none print:m-0 print:p-0">
        <div className="p-10 sm:p-12">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-surface-100 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary-600 mb-2">
                {settings?.general?.storeName || 'Optical Store'}
              </h1>
              <div className="text-sm text-surface-600 space-y-1">
                {settings?.general?.address && <p>{settings.general.address}</p>}
                {settings?.general?.phone && <p>Phone: {settings.general.phone}</p>}
                {settings?.general?.email && <p>Email: {settings.general.email}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-surface-200 uppercase tracking-wider mb-2">
                Invoice
              </h2>
              <div className="text-sm text-surface-600 space-y-1">
                <p><strong>Invoice No:</strong> {settings?.sales?.invoicePrefix || 'INV-'}{sale.invoiceNumber}</p>
                <p><strong>Date:</strong> {format(new Date(sale.createdAt), 'dd MMM yyyy')}</p>
                <p><strong>Payment:</strong> <span className="capitalize">{sale.paymentMethod}</span></p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Bill To</h3>
            <div className="text-surface-800">
              <p className="font-bold text-lg">{sale.customer?.name || sale.customerName || 'Walk-in Customer'}</p>
              {(sale.customer?.phone || sale.customerPhone) && <p className="text-sm text-surface-600">Phone: {sale.customer?.phone || sale.customerPhone}</p>}
              {sale.customer?.email && <p className="text-sm text-surface-600">Email: {sale.customer.email}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50 text-surface-600 text-sm border-y border-surface-200">
                  <th className="py-3 px-4 font-semibold">Item Description</th>
                  <th className="py-3 px-4 font-semibold text-center">Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="text-surface-800 text-sm">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-surface-100 last:border-b-0">
                    <td className="py-4 px-4">
                      <div className="font-medium text-base">{item.productName}</div>
                      {item.glassDetails?.name && (
                        <div className="text-xs text-surface-600 mt-1">
                          <span className="font-semibold text-primary-600">+ Lens:</span> {item.glassDetails.name}
                        </div>
                      )}
                      {item.prescriptionDetails && (item.prescriptionDetails.rightEye?.sph || item.prescriptionDetails.leftEye?.sph) && (
                        <div className="mt-3 overflow-hidden rounded border border-surface-200 inline-block w-full max-w-sm">
                          <table className="w-full text-[11px] text-center border-collapse bg-white">
                            <thead>
                              <tr className="bg-surface-100 text-surface-700 border-b border-surface-200">
                                <th className="py-1.5 px-2 border-r border-surface-200 font-bold w-16">Eye</th>
                                <th className="py-1.5 px-2 border-r border-surface-200 font-bold">SPH</th>
                                <th className="py-1.5 px-2 border-r border-surface-200 font-bold">CYL</th>
                                <th className="py-1.5 px-2 border-r border-surface-200 font-bold">AXIS</th>
                                <th className="py-1.5 px-2 font-bold">ADD</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-surface-200">
                                <td className="py-1.5 px-2 border-r border-surface-200 font-bold bg-surface-50 text-surface-700">Right (OD)</td>
                                <td className="py-1.5 px-2 border-r border-surface-200">{item.prescriptionDetails.rightEye?.sph || '-'}</td>
                                <td className="py-1.5 px-2 border-r border-surface-200">{item.prescriptionDetails.rightEye?.cyl || '-'}</td>
                                <td className="py-1.5 px-2 border-r border-surface-200">{item.prescriptionDetails.rightEye?.axis || '-'}</td>
                                <td className="py-1.5 px-2">{item.prescriptionDetails.rightEye?.add || '-'}</td>
                              </tr>
                              <tr>
                                <td className="py-1.5 px-2 border-r border-surface-200 font-bold bg-surface-50 text-surface-700">Left (OS)</td>
                                <td className="py-1.5 px-2 border-r border-surface-200">{item.prescriptionDetails.leftEye?.sph || '-'}</td>
                                <td className="py-1.5 px-2 border-r border-surface-200">{item.prescriptionDetails.leftEye?.cyl || '-'}</td>
                                <td className="py-1.5 px-2 border-r border-surface-200">{item.prescriptionDetails.leftEye?.axis || '-'}</td>
                                <td className="py-1.5 px-2">{item.prescriptionDetails.leftEye?.add || '-'}</td>
                              </tr>
                            </tbody>
                          </table>
                          {item.prescriptionDetails.pd && (
                            <div className="py-1.5 px-2 bg-surface-50 text-[11px] font-bold text-surface-700 border-t border-surface-200 text-center">
                              PD (Pupillary Distance): {item.prescriptionDetails.pd}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center align-top">{item.quantity}</td>
                    <td className="py-4 px-4 text-right align-top">
                      <div>{fmt(item.unitPrice)}</div>
                      {item.glassDetails?.name && item.glassDetails?.price > 0 && (
                        <div className="text-xs text-surface-500 mt-1">+{fmt(item.glassDetails.price)}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold align-top">
                      <div>{fmt(item.quantity * item.unitPrice)}</div>
                      {item.glassDetails?.name && item.glassDetails?.price > 0 && (
                        <div className="text-xs text-surface-500 font-normal mt-1">+{fmt(item.quantity * item.glassDetails.price)}</div>
                      )}
                      {item.glassDetails?.name && item.glassDetails?.price > 0 && (
                        <div className="text-sm mt-1 border-t border-surface-200 pt-1 text-primary-700">{fmt(item.total)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-64 space-y-3 text-sm">
              <div className="flex justify-between text-surface-600">
                <span>Subtotal:</span>
                <span>{fmt(sale.subtotal)}</span>
              </div>
              {sale.totalDiscount > 0 && (
                <div className="flex justify-between text-danger-500">
                  <span>Discount:</span>
                  <span>-{fmt(sale.totalDiscount)}</span>
                </div>
              )}
              {sale.totalTax > 0 && (
                <div className="flex justify-between text-surface-600">
                  <span>Tax:</span>
                  <span>+{fmt(sale.totalTax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-surface-900 border-t border-surface-200 pt-3">
                <span>Grand Total:</span>
                <span>{fmt(sale.grandTotal)}</span>
              </div>
              {sale.balanceDue > 0 && (
                <div className="flex justify-between text-warning-600 font-medium">
                  <span>Balance Due:</span>
                  <span>{fmt(sale.balanceDue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer & Terms */}
          <div className="border-t border-surface-100 pt-8 text-xs text-surface-500">
            {settings?.pdf?.termsAndConditions && (
              <div className="mb-4">
                <h4 className="font-bold text-surface-700 mb-1">Terms & Conditions</h4>
                <p className="whitespace-pre-wrap">{settings.pdf.termsAndConditions}</p>
              </div>
            )}
            <div className="text-center mt-8">
              <p>{settings?.pdf?.footerText || 'Thank you for your business!'}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
