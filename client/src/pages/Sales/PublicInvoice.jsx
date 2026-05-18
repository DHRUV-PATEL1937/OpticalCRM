import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import api from '../../services/api';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { format } from 'date-fns';

export default function PublicInvoice() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const res = await fetch(`/api/sales/public/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Invoice not found');
      setSale(data.data.sale);
      setSettings(data.data.settings);
    } catch (err) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!sale) return;
    generateInvoicePDF(sale, settings);
  };

  const currency = settings?.general?.currency || 'INR';
  const fmt = (v) => `${currency} ${(v||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🧾</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Download Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-indigo-600 mb-1">
                  {settings?.general?.storeName || 'Optical Store'}
                </h1>
                <div className="text-sm text-gray-500 space-y-0.5">
                  {settings?.general?.address && <p>{settings.general.address}</p>}
                  {settings?.general?.phone && <p>Phone: {settings.general.phone}</p>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-gray-200 uppercase tracking-wider mb-1">Invoice</h2>
                <div className="text-sm text-gray-500 space-y-0.5">
                  <p><strong>No:</strong> {settings?.sales?.invoicePrefix || 'INV-'}{sale.invoiceNumber}</p>
                  <p><strong>Date:</strong> {format(new Date(sale.createdAt), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</h3>
              <p className="font-bold text-lg text-gray-800">{sale.customer?.name || sale.customerName || 'Walk-in Customer'}</p>
              {(sale.customer?.phone || sale.customerPhone) && <p className="text-sm text-gray-500">Phone: {sale.customer?.phone || sale.customerPhone}</p>}
            </div>

            {/* Items */}
            <div className="mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
                    <th className="py-3 px-4 font-semibold">Item</th>
                    <th className="py-3 px-4 font-semibold text-center">Qty</th>
                    <th className="py-3 px-4 font-semibold text-right">Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 text-sm">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="font-medium">{item.productName}</div>
                        {item.glassDetails?.name && (
                          <div className="text-xs text-gray-500 mt-0.5">+ Lens: {item.glassDetails.name}</div>
                        )}
                        {item.prescriptionDetails && (item.prescriptionDetails.rightEye?.sph || item.prescriptionDetails.leftEye?.sph) && (
                          <div className="mt-2 overflow-hidden rounded border border-gray-200 inline-block w-full max-w-sm">
                            <table className="w-full text-[11px] text-center border-collapse bg-white">
                              <thead>
                                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                                  <th className="py-1 px-2 border-r border-gray-200 font-bold w-16">Eye</th>
                                  <th className="py-1 px-2 border-r border-gray-200 font-bold">SPH</th>
                                  <th className="py-1 px-2 border-r border-gray-200 font-bold">CYL</th>
                                  <th className="py-1 px-2 border-r border-gray-200 font-bold">AXIS</th>
                                  <th className="py-1 px-2 font-bold">ADD</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-gray-200">
                                  <td className="py-1 px-2 border-r border-gray-200 font-bold bg-gray-50">OD</td>
                                  <td className="py-1 px-2 border-r border-gray-200">{item.prescriptionDetails.rightEye?.sph || '-'}</td>
                                  <td className="py-1 px-2 border-r border-gray-200">{item.prescriptionDetails.rightEye?.cyl || '-'}</td>
                                  <td className="py-1 px-2 border-r border-gray-200">{item.prescriptionDetails.rightEye?.axis || '-'}</td>
                                  <td className="py-1 px-2">{item.prescriptionDetails.rightEye?.add || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-1 px-2 border-r border-gray-200 font-bold bg-gray-50">OS</td>
                                  <td className="py-1 px-2 border-r border-gray-200">{item.prescriptionDetails.leftEye?.sph || '-'}</td>
                                  <td className="py-1 px-2 border-r border-gray-200">{item.prescriptionDetails.leftEye?.cyl || '-'}</td>
                                  <td className="py-1 px-2 border-r border-gray-200">{item.prescriptionDetails.leftEye?.axis || '-'}</td>
                                  <td className="py-1 px-2">{item.prescriptionDetails.leftEye?.add || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center align-top">{item.quantity}</td>
                      <td className="py-3 px-4 text-right align-top">{fmt(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right font-semibold align-top">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal:</span>
                  <span>{fmt(sale.subtotal)}</span>
                </div>
                {sale.totalDiscount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span>-{fmt(sale.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Grand Total:</span>
                  <span>{fmt(sale.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
              <p>{settings?.pdf?.footerText || 'Thank you for your business!'}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by {settings?.general?.storeName || 'OpticalCRM'}
        </p>
      </div>
    </div>
  );
}
