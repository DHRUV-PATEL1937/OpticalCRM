import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, User, ShoppingCart, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import BarcodeScanner from '../../components/ui/BarcodeScanner';
import useCartStore from '../../store/cartStore';
import api, { productAPI, customerAPI, salesAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function CreateBill() {
  const navigate = useNavigate();
  const { items, customer, paymentMethod, discount, notes, addItem, removeItem, updateItemQuantity, updateItemDiscount, setCustomer, setPaymentMethod, setDiscount, setNotes, getSubtotal, getTotalDiscount, getTotalTax, getGrandTotal, clearCart } = useCartStore();

  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState('');
  const [lastSaleId, setLastSaleId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [finalInput, setFinalInput] = useState('');
  const [isFinalFocused, setIsFinalFocused] = useState(false);
  const [settings, setSettings] = useState(null);
  
  // Walk-in overrides
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  
  const productSearchRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data || res);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  // Product search with Barcode Scanner Auto-add
  useEffect(() => {
    if (productSearch.length < 2) { setProductResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await productAPI.search(productSearch);
        if (res.exactMatch && res.data.length === 1) {
          // It's an exact barcode scan, auto-add to cart
          handleAddProduct(res.data[0]);
          toast.success(`Scanned: ${res.data[0].name}`);
        } else {
          setProductResults(res.data);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Customer search
  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await customerAPI.search(customerSearch);
        setCustomerResults(res.data);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Auto-fill walk-in customer
  useEffect(() => {
    if (walkInPhone.length >= 10) {
      const checkPhone = async () => {
        try {
          const res = await customerAPI.search(walkInPhone);
          const exactMatch = res.data.find(c => c.phone === walkInPhone);
          if (exactMatch && !walkInName) {
            setWalkInName(exactMatch.name);
            toast.success(`Found existing customer: ${exactMatch.name}`);
          }
        } catch (err) {}
      };
      checkPhone();
    }
  }, [walkInPhone]);

  const handleAddProduct = (product) => {
    if (product.stockQuantity <= 0) { toast.error('Product out of stock'); return; }
    const existing = items.find(i => i.product === product._id);
    if (existing && existing.quantity >= product.stockQuantity) { toast.error('Max stock reached'); return; }
    addItem(product);
    setProductSearch('');
    setProductResults([]);
    setShowScanner(false);
    productSearchRef.current?.focus();
  };

  const handleBarcodeScan = async (decodedText) => {
    try {
      const res = await productAPI.search(decodedText);
      if (res.data.length > 0) {
        handleAddProduct(res.data[0]);
        toast.success(`Scanned: ${res.data[0].name}`);
      } else {
        toast.error(`No product found for barcode: ${decodedText}`);
      }
    } catch {
      toast.error('Scan failed');
    }
  };

  const handleSelectCustomer = (c) => {
    setCustomer(c);
    setWalkInName('');
    setWalkInPhone('');
    setShowCustomerSearch(false);
    setCustomerSearch('');
    setCustomerResults([]);
  };

  const handleSubmit = async () => {
    if (items.length === 0) { toast.error('Add at least one product'); return; }
    setSubmitting(true);
    try {
      const saleData = {
        customer: customer?._id,
        customerName: customer?.name || walkInName || 'Walk-in Customer',
        customerPhone: customer?.phone || walkInPhone || '',
        items: items.map(i => ({ 
          product: i.product, 
          productName: i.productName, 
          productSku: i.productSku, 
          quantity: i.quantity, 
          unitPrice: i.unitPrice, 
          discount: i.discount, 
          tax: i.tax, 
          total: i.total,
          prescriptionDetails: i.hasPrescription ? i.prescriptionDetails : undefined,
          glassDetails: i.hasPrescription ? i.glassDetails : undefined
        })),
        subtotal: getSubtotal(),
        totalDiscount: getTotalDiscount(),
        totalTax: getTotalTax(),
        grandTotal: getGrandTotal(),
        paymentMethod,
        amountPaid: getGrandTotal(),
        notes,
      };
      const res = await salesAPI.create(saleData);
      setLastInvoice(res.data.invoiceNumber);
      setLastSaleId(res.data._id);
      setShowSuccess(true);
      clearCart();
    } catch {}
    finally { setSubmitting(false); }
  };

  const fmt = (v) => `₹${(v||0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'upi', label: 'UPI', icon: Smartphone },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Create Bill</h1>
          <p className="text-surface-500 text-sm mt-0.5">Add products and complete the sale</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Product search + items */}
        <div className="xl:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              {customer ? (
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-surface-900">{customer.name}</p>
                    <p className="text-xs text-surface-500">{customer.phone} {customer.category !== 'regular' && <Badge color={customer.category === 'vip' ? 'vip' : 'premium'} className="ml-1">{customer.category}</Badge>}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>Change</Button>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="relative">
                    <Input placeholder="Search customer by name or phone..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerSearch(true); }} icon={Search} />
                    {showCustomerSearch && customerResults.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {customerResults.map((c) => (
                          <button key={c._id} onClick={() => handleSelectCustomer(c)} className="w-full text-left px-4 py-3 hover:bg-surface-50 flex items-center gap-3 text-sm cursor-pointer border-b border-surface-50 last:border-0">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600">{c.name.charAt(0)}</div>
                            <div><p className="font-medium">{c.name}</p><p className="text-xs text-surface-400">{c.phone}</p></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-surface-400 mt-2 mb-1">Or continue as Walk-in Customer:</p>
                  <div className="flex gap-2">
                    <Input placeholder="Walk-in Name (Optional)" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} />
                    <Input placeholder="Walk-in Phone (Optional)" value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Product Search */}
          <Card>
            <div className="relative flex items-center gap-3">
              <div className="flex-1">
                <Input ref={productSearchRef} placeholder="Search product by name, SKU, or barcode..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} icon={Search} />
              </div>
              <Button onClick={() => setShowScanner(true)} variant="secondary" className="px-4">Scan</Button>
              {productResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {productResults.map((p) => (
                    <button key={p._id} onClick={() => handleAddProduct(p)} className="w-full text-left px-4 py-3 hover:bg-surface-50 flex items-center justify-between text-sm cursor-pointer border-b border-surface-50 last:border-0">
                      <div>
                        <p className="font-medium text-surface-900">{p.name}</p>
                        <p className="text-xs text-surface-400">{p.sku} • {p.brand} • Stock: {p.stockQuantity}</p>
                      </div>
                      <p className="font-semibold text-primary-600">{fmt(p.sellingPrice)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Cart Items */}
          <Card padding={false}>
            {items.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShoppingCart className="w-16 h-16 text-surface-200 mx-auto mb-4" />
                <p className="text-surface-500 text-lg font-medium">No items added</p>
                <p className="text-surface-400 text-sm mt-1">Search for products above to add them to the bill</p>
              </div>
            ) : (
              <div>
                <div className="px-6 py-3 bg-surface-50/50 border-b border-surface-100 grid grid-cols-12 text-xs font-medium text-surface-500 uppercase tracking-wider">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((item) => (
                  <div key={item.product} className="border-b border-surface-50 last:border-0">
                    <div className="px-6 py-4 grid grid-cols-12 items-center gap-2">
                      <div className="col-span-5">
                        <p className="font-medium text-surface-900 text-sm">{item.productName}</p>
                        <p className="text-xs text-surface-400">{item.productSku}</p>
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button onClick={() => updateItemQuantity(item.product, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors cursor-pointer"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                        <button onClick={() => { if(item.quantity < item.maxStock) updateItemQuantity(item.product, item.quantity + 1); }} className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors cursor-pointer"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="col-span-2 text-right text-sm text-surface-600">
                        {fmt(item.unitPrice)}
                        {item.glassDetails?.price > 0 && <div className="text-xs text-primary-600">+{fmt(item.glassDetails.price)}</div>}
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold">{fmt(item.total)}</div>
                      <div className="col-span-1 text-right">
                        <button onClick={() => removeItem(item.product)} className="p-1 rounded-lg text-surface-400 hover:text-danger-500 hover:bg-danger-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Lens Selection (Always Visible) */}
                    <div className="px-6 py-2 bg-surface-50/30 flex items-center gap-3">
                      <label className="text-sm font-medium text-surface-700 whitespace-nowrap">Select Lens:</label>
                      <select 
                        className="flex-1 rounded-xl border border-surface-200 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                        value={item.glassDetails?.name || ''}
                        onChange={(e) => {
                          const selectedGlassName = e.target.value;
                          const glassTypes = settings?.sales?.glassTypes || [];
                          const found = glassTypes.find(g => g.name === selectedGlassName);
                          const newGlass = found ? { name: found.name, price: Number(found.price) } : { name: '', price: 0 };
                          useCartStore.getState().updateItemPrescription(item.product, item.hasPrescription, item.prescriptionDetails, newGlass);
                        }}
                      >
                        <option value="">No Lens</option>
                        {(settings?.sales?.glassTypes || []).map(g => (
                          <option key={g.id} value={g.name}>{g.name} - {fmt(g.price)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Prescription Section */}
                    <div className="px-6 pb-4 bg-surface-50/30">
                      <div className="flex items-center gap-2 mb-3 mt-1">
                        <input 
                          type="checkbox" 
                          id={`rx-${item.product}`}
                          className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer"
                          checked={item.hasPrescription}
                          onChange={(e) => {
                            const { updateItemPrescription } = useCartStore.getState();
                            updateItemPrescription(item.product, e.target.checked, item.prescriptionDetails, item.glassDetails);
                          }}
                        />
                        <label htmlFor={`rx-${item.product}`} className="text-sm font-medium text-surface-700 cursor-pointer">Add Prescription Data</label>
                      </div>

                      {item.hasPrescription && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2 p-4 bg-white rounded-xl border border-surface-200 shadow-sm">
                          {/* Right Eye */}
                          <div>
                            <p className="text-xs font-bold text-surface-500 uppercase mb-2 border-b border-surface-100 pb-1">Right Eye (OD)</p>
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-surface-400 mb-1">SPH</label>
                                <Input placeholder="e.g. -1.00" className="text-xs font-mono" value={item.prescriptionDetails?.rightEye?.sph || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, rightEye: { ...item.prescriptionDetails.rightEye, sph: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-surface-400 mb-1">CYL</label>
                                <Input placeholder="e.g. -0.50" className="text-xs font-mono" value={item.prescriptionDetails?.rightEye?.cyl || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, rightEye: { ...item.prescriptionDetails.rightEye, cyl: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-surface-400 mb-1">AXIS</label>
                                <Input placeholder="e.g. 180" className="text-xs font-mono" value={item.prescriptionDetails?.rightEye?.axis || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, rightEye: { ...item.prescriptionDetails.rightEye, axis: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-surface-400 mb-1">ADD</label>
                                <Input placeholder="e.g. +2.00" className="text-xs font-mono" value={item.prescriptionDetails?.rightEye?.add || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, rightEye: { ...item.prescriptionDetails.rightEye, add: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                            </div>
                          </div>
                          {/* Left Eye */}
                          <div>
                            <p className="text-xs font-bold text-surface-500 uppercase mb-2 border-b border-surface-100 pb-1">Left Eye (OS)</p>
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-surface-400 mb-1">SPH</label>
                                <Input placeholder="e.g. -1.00" className="text-xs font-mono" value={item.prescriptionDetails?.leftEye?.sph || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, leftEye: { ...item.prescriptionDetails.leftEye, sph: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-surface-400 mb-1">CYL</label>
                                <Input placeholder="e.g. -0.50" className="text-xs font-mono" value={item.prescriptionDetails?.leftEye?.cyl || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, leftEye: { ...item.prescriptionDetails.leftEye, cyl: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-surface-400 mb-1">AXIS</label>
                                <Input placeholder="e.g. 180" className="text-xs font-mono" value={item.prescriptionDetails?.leftEye?.axis || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, leftEye: { ...item.prescriptionDetails.leftEye, axis: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-surface-400 mb-1">ADD</label>
                                <Input placeholder="e.g. +2.00" className="text-xs font-mono" value={item.prescriptionDetails?.leftEye?.add || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, leftEye: { ...item.prescriptionDetails.leftEye, add: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                            </div>
                          </div>
                          
                          {/* PD Field */}
                          <div className="lg:col-span-2 pt-3 border-t border-surface-100">
                            <div className="w-full sm:w-1/3">
                              <label className="block text-[10px] font-bold text-surface-400 mb-1">PD (PUPIL DISTANCE)</label>
                              <Input placeholder="e.g. 62" className="text-xs font-mono" value={item.prescriptionDetails?.pd || ''} onChange={(e) => {
                                const newDetails = { ...item.prescriptionDetails, pd: e.target.value };
                                useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                              }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <h3 className="text-lg font-bold text-surface-900 mb-6">Bill Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-surface-600">
                <span>Subtotal ({items.length} items)</span>
                <span>{fmt(getSubtotal())}</span>
              </div>

              {/* Extra Discount */}
              <div className="flex items-center gap-2">
                <span className="text-surface-600 text-sm">Extra Discount</span>
                <input 
                  type="number" 
                  className="w-24 ml-auto px-2 py-1 text-right text-sm border border-surface-200 rounded-lg focus:border-primary-500 focus:outline-none" 
                  value={discount === 0 ? '' : discount} 
                  onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : 0)} 
                  placeholder="0" 
                />
              </div>

              {/* Settled / Final Amount */}
              <div className="flex items-center gap-2">
                <span className="text-surface-600 text-sm font-medium">Final Settled Amount</span>
                <input 
                  type="number" 
                  className="w-28 ml-auto px-2 py-1 text-right text-sm border border-primary-200 bg-primary-50 text-primary-700 font-bold rounded-lg focus:border-primary-500 focus:outline-none" 
                  value={isFinalFocused ? finalInput : (getGrandTotal() || '')} 
                  onFocus={() => { setIsFinalFocused(true); setFinalInput(getGrandTotal() || ''); }}
                  onBlur={() => setIsFinalFocused(false)}
                  onChange={(e) => {
                    setFinalInput(e.target.value);
                    if (e.target.value === '') {
                      setDiscount(0);
                    } else {
                      const beforeExtra = getSubtotal() - (getTotalDiscount() - discount) + getTotalTax();
                      setDiscount(Math.max(0, beforeExtra - Number(e.target.value)));
                    }
                  }} 
                  placeholder="0" 
                />
              </div>

              {getTotalDiscount() > 0 && (
                <div className="flex justify-between text-danger-500">
                  <span>Total Discount</span>
                  <span>-{fmt(getTotalDiscount())}</span>
                </div>
              )}

              <div className="flex justify-between text-surface-600">
                <span>Tax (GST)</span>
                <span>+{fmt(getTotalTax())}</span>
              </div>

              <div className="border-t border-surface-200 pt-3 flex justify-between text-lg font-bold text-surface-900">
                <span>Grand Total</span>
                <span className="text-primary-600">{fmt(getGrandTotal())}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-6">
              <p className="text-sm font-medium text-surface-700 mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                      paymentMethod === pm.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-surface-200 text-surface-500 hover:border-surface-300'
                    }`}
                  >
                    <pm.icon className="w-5 h-5" />
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <textarea
                rows={2}
                placeholder="Notes (optional)..."
                className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              loading={submitting}
              className="w-full mt-4"
              size="xl"
              disabled={items.length === 0}
            >
              Complete Sale — {fmt(getGrandTotal())}
            </Button>

            {items.length > 0 && (
              <Button variant="ghost" size="sm" className="w-full mt-2 text-danger-500" onClick={clearCart}>
                Clear All
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Sale Completed!" size="sm">
        <div className="text-center py-4">
          <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-surface-900 mb-2">Bill Created!</h3>
          <p className="text-surface-500 mb-1">Invoice: <strong className="text-primary-600">{lastInvoice}</strong></p>
          <div className="flex flex-col gap-3 mt-6">
            <Button onClick={() => { setShowSuccess(false); navigate(`/invoice/${lastSaleId}`); }} size="lg">
              View Invoice
            </Button>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => { setShowSuccess(false); navigate('/sales'); }}>Sales History</Button>
              <Button variant="secondary" onClick={() => { setShowSuccess(false); productSearchRef.current?.focus(); }}>New Bill</Button>
            </div>
          </div>
        </div>
      </Modal>

      {showScanner && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
}
