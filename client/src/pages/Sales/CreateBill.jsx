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
          <Card className="p-8 shadow-sm">
            <h3 className="text-lg font-bold text-surface-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Customer Details
            </h3>
            
            {customer ? (
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-2xl border border-primary-100">
                <div>
                  <p className="font-bold text-primary-900 text-lg mb-1">{customer.name}</p>
                  <p className="text-sm text-primary-600 flex items-center gap-2">
                    {customer.phone} 
                    {customer.category !== 'regular' && (
                      <Badge color={customer.category === 'vip' ? 'vip' : 'premium'}>{customer.category}</Badge>
                    )}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setCustomer(null)} className="bg-white hover:bg-surface-50 border-primary-200 text-primary-700">
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <Input 
                    placeholder="Search existing customer by name or phone..." 
                    value={customerSearch} 
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerSearch(true); }} 
                    icon={Search} 
                    className="text-base py-3 bg-surface-50"
                  />
                  {showCustomerSearch && customerResults.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-surface-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button key={c._id} onClick={() => handleSelectCustomer(c)} className="w-full text-left px-5 py-3 hover:bg-primary-50 flex items-center gap-4 cursor-pointer border-b border-surface-100 last:border-0 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-surface-900">{c.name}</p>
                            <p className="text-sm text-surface-500">{c.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-surface-200"></div>
                  <span className="flex-shrink-0 mx-4 text-sm font-medium text-surface-400">OR NEW WALK-IN</span>
                  <div className="flex-grow border-t border-surface-200"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input 
                    label="Customer Name"
                    placeholder="Optional" 
                    value={walkInName} 
                    onChange={(e) => setWalkInName(e.target.value)} 
                    className="bg-surface-50"
                  />
                  <Input 
                    label="Phone Number"
                    placeholder="Optional" 
                    value={walkInPhone} 
                    onChange={(e) => setWalkInPhone(e.target.value)} 
                    className="bg-surface-50"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Product Search */}
          <div className="relative flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-surface-100">
            <div className="flex-1 w-full relative">
              <Input 
                ref={productSearchRef} 
                placeholder="Search products by name, SKU, or barcode..." 
                value={productSearch} 
                onChange={(e) => setProductSearch(e.target.value)} 
                icon={Search} 
                className="py-3 text-base shadow-inner bg-surface-50 border-primary-100 focus:border-primary-500 focus:ring-primary-200"
              />
            </div>
            <Button onClick={() => setShowScanner(true)} variant="secondary" size="lg" className="w-full sm:w-auto px-8 font-bold border-primary-200 hover:border-primary-300">
              Scan Barcode
            </Button>
            
            {productResults.length > 0 && (
              <div className="absolute z-30 top-full left-0 right-0 mt-3 bg-white border border-surface-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto">
                {productResults.map((p) => (
                  <button key={p._id} onClick={() => handleAddProduct(p)} className="w-full text-left px-6 py-4 hover:bg-primary-50 flex items-center justify-between cursor-pointer border-b border-surface-100 last:border-0 transition-colors group">
                    <div>
                      <p className="font-bold text-surface-900 group-hover:text-primary-700 text-base mb-1">{p.name}</p>
                      <p className="text-sm text-surface-500">
                        <span className="font-mono bg-surface-100 px-2 py-0.5 rounded mr-2">{p.sku}</span> 
                        {p.brand} • <span className={p.stockQuantity > 0 ? "text-success-600" : "text-danger-500"}>{p.stockQuantity} in stock</span>
                      </p>
                    </div>
                    <p className="font-black text-lg text-primary-600">{fmt(p.sellingPrice)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <Card padding={false} className="overflow-hidden">
            {items.length === 0 ? (
              <div className="text-center py-24 px-4 bg-surface-50/50">
                <ShoppingCart className="w-20 h-20 text-surface-300 mx-auto mb-6" />
                <p className="text-surface-600 text-xl font-bold">No items in the bill</p>
                <p className="text-surface-400 mt-2">Search or scan products above to add them</p>
              </div>
            ) : (
              <div>
                <div className="hidden sm:grid px-6 py-4 bg-surface-100 border-b border-surface-200 grid-cols-12 text-xs font-bold text-surface-500 uppercase tracking-widest">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                
                {items.map((item) => (
                  <div key={item.product} className="border-b border-surface-200 last:border-0 bg-white">
                    <div className="px-6 py-5 flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-4">
                      {/* Product Name/SKU */}
                      <div className="sm:col-span-5">
                        <p className="font-bold text-surface-900 text-base">{item.productName}</p>
                        <p className="text-sm font-mono text-surface-400 mt-1">{item.productSku}</p>
                      </div>
                      
                      {/* Controls Row (Mobile) / Grid (Desktop) */}
                      <div className="flex items-center justify-between sm:contents">
                        <div className="sm:col-span-2 flex items-center justify-center gap-3">
                          <button onClick={() => updateItemQuantity(item.product, item.quantity - 1)} className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors cursor-pointer border border-surface-200 shadow-sm"><Minus className="w-4 h-4 text-surface-700" /></button>
                          <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                          <button onClick={() => { if(item.quantity < item.maxStock) updateItemQuantity(item.product, item.quantity + 1); }} className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors cursor-pointer border border-surface-200 shadow-sm"><Plus className="w-4 h-4 text-surface-700" /></button>
                        </div>
                        
                        <div className="sm:col-span-2 sm:text-right text-base text-surface-600 font-medium">
                          <span className="sm:hidden text-xs text-surface-400 mr-2 uppercase">Price:</span>
                          {fmt(item.unitPrice)}
                          {item.glassDetails?.price > 0 && <div className="text-sm text-primary-600 font-bold">+{fmt(item.glassDetails.price)} <span className="text-xs font-normal">lens</span></div>}
                        </div>
                        
                        <div className="sm:col-span-2 sm:text-right text-lg font-black text-surface-900">
                           <span className="sm:hidden text-xs text-surface-400 mr-2 uppercase font-medium">Total:</span>
                          {fmt(item.total)}
                        </div>
                        
                        <div className="sm:col-span-1 sm:text-right">
                          <button onClick={() => removeItem(item.product)} className="p-2.5 rounded-full text-surface-400 hover:text-danger-500 hover:bg-danger-50 transition-colors cursor-pointer"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>

                    {/* Lens Selection (Always Visible) */}
                    <div className="px-6 py-4 bg-primary-50/50 border-t border-surface-100 flex flex-col sm:flex-row sm:items-center gap-4">
                      <label className="text-sm font-bold text-primary-900 whitespace-nowrap">👓 Select Lens:</label>
                      <select 
                        className="flex-1 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-900 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none shadow-sm transition-all"
                        value={item.glassDetails?.name || ''}
                        onChange={(e) => {
                          const selectedGlassName = e.target.value;
                          const glassTypes = settings?.sales?.glassTypes || [];
                          const found = glassTypes.find(g => g.name === selectedGlassName);
                          const newGlass = found ? { name: found.name, price: Number(found.price) } : { name: '', price: 0 };
                          useCartStore.getState().updateItemPrescription(item.product, item.hasPrescription, item.prescriptionDetails, newGlass);
                        }}
                      >
                        <option value="">-- No Lens Selected --</option>
                        {(settings?.sales?.glassTypes || []).map(g => (
                          <option key={g.id} value={g.name}>{g.name} - {fmt(g.price)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Prescription Section */}
                    <div className="px-6 pb-6 bg-primary-50/50">
                      <div className="flex items-center gap-3 mb-4 mt-2">
                        <input 
                          type="checkbox" 
                          id={`rx-${item.product}`}
                          className="w-5 h-5 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer shadow-sm"
                          checked={item.hasPrescription}
                          onChange={(e) => {
                            const { updateItemPrescription } = useCartStore.getState();
                            updateItemPrescription(item.product, e.target.checked, item.prescriptionDetails, item.glassDetails);
                          }}
                        />
                        <label htmlFor={`rx-${item.product}`} className="text-base font-bold text-surface-800 cursor-pointer select-none">Add Prescription Details</label>
                      </div>

                      {item.hasPrescription && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4 p-6 bg-white rounded-2xl border-2 border-primary-100 shadow-md">
                          {/* Right Eye */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b-2 border-surface-100 pb-2">
                              <span className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center font-black text-surface-700">R</span>
                              <p className="text-sm font-black text-surface-800 uppercase tracking-wider">Right Eye (OD)</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 tracking-wide">SPH</label>
                                <Input placeholder="-1.00" className="text-sm font-mono text-center font-bold" value={item.prescriptionDetails?.rightEye?.sph || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, rightEye: { ...item.prescriptionDetails.rightEye, sph: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 tracking-wide">CYL</label>
                                <Input placeholder="-0.50" className="text-sm font-mono text-center font-bold" value={item.prescriptionDetails?.rightEye?.cyl || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, rightEye: { ...item.prescriptionDetails.rightEye, cyl: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 tracking-wide">AXIS</label>
                                <Input placeholder="180" className="text-sm font-mono text-center font-bold" value={item.prescriptionDetails?.rightEye?.axis || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, rightEye: { ...item.prescriptionDetails.rightEye, axis: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 tracking-wide">ADD</label>
                                <Input placeholder="+2.00" className="text-sm font-mono text-center font-bold" value={item.prescriptionDetails?.rightEye?.add || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, rightEye: { ...item.prescriptionDetails.rightEye, add: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                            </div>
                          </div>
                          {/* Left Eye */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b-2 border-surface-100 pb-2">
                              <span className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center font-black text-surface-700">L</span>
                              <p className="text-sm font-black text-surface-800 uppercase tracking-wider">Left Eye (OS)</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 tracking-wide">SPH</label>
                                <Input placeholder="-1.00" className="text-sm font-mono text-center font-bold" value={item.prescriptionDetails?.leftEye?.sph || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, leftEye: { ...item.prescriptionDetails.leftEye, sph: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 tracking-wide">CYL</label>
                                <Input placeholder="-0.50" className="text-sm font-mono text-center font-bold" value={item.prescriptionDetails?.leftEye?.cyl || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, leftEye: { ...item.prescriptionDetails.leftEye, cyl: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 tracking-wide">AXIS</label>
                                <Input placeholder="180" className="text-sm font-mono text-center font-bold" value={item.prescriptionDetails?.leftEye?.axis || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, leftEye: { ...item.prescriptionDetails.leftEye, axis: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                              <div>
                                <label className="block text-xs font-black text-surface-500 mb-2 tracking-wide">ADD</label>
                                <Input placeholder="+2.00" className="text-sm font-mono text-center font-bold" value={item.prescriptionDetails?.leftEye?.add || ''} onChange={(e) => {
                                  const val = e.target.value.replace(/[^+-\d.]/g, '');
                                  const newDetails = { ...item.prescriptionDetails, leftEye: { ...item.prescriptionDetails.leftEye, add: val } };
                                  useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                                }} />
                              </div>
                            </div>
                          </div>
                          
                          {/* PD Field */}
                          <div className="lg:col-span-2 pt-4 border-t-2 border-surface-100 bg-surface-50 -mx-6 -mb-6 p-6 rounded-b-xl flex flex-col sm:flex-row sm:items-center gap-4">
                            <label className="block text-sm font-black text-surface-700 tracking-wide whitespace-nowrap">PUPIL DISTANCE (PD)</label>
                            <Input placeholder="e.g. 62" className="w-full sm:w-32 text-base font-mono font-bold" value={item.prescriptionDetails?.pd || ''} onChange={(e) => {
                              const newDetails = { ...item.prescriptionDetails, pd: e.target.value };
                              useCartStore.getState().updateItemPrescription(item.product, true, newDetails, item.glassDetails);
                            }} />
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
        <div className="space-y-6">
          <Card className="sticky top-24 p-8 shadow-md border-primary-100">
            <h3 className="text-xl font-black text-surface-900 mb-8 pb-4 border-b-2 border-surface-100">Bill Summary</h3>

            <div className="space-y-5">
              <div className="flex justify-between items-center text-surface-600 text-base">
                <span>Subtotal <span className="text-sm bg-surface-100 px-2 py-0.5 rounded ml-1">{items.length} items</span></span>
                <span className="font-bold">{fmt(getSubtotal())}</span>
              </div>

              {/* Extra Discount */}
              <div className="flex justify-between items-center group">
                <span className="text-surface-600 text-sm font-medium">Extra Discount</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    className="w-full pl-7 pr-3 py-2 text-right font-bold text-base border-2 border-surface-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none" 
                    value={discount === 0 ? '' : discount} 
                    onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : 0)} 
                    placeholder="0" 
                  />
                </div>
              </div>

              {/* Settled / Final Amount */}
              <div className="flex justify-between items-center bg-primary-50 p-4 rounded-xl border border-primary-100">
                <span className="text-primary-800 text-sm font-black tracking-wide">FINAL AMOUNT</span>
                <div className="relative w-36">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600 font-bold">₹</span>
                  <input 
                    type="number" 
                    className="w-full pl-7 pr-3 py-2.5 text-right font-black text-lg border-2 border-primary-300 bg-white text-primary-700 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-200 transition-all outline-none shadow-sm" 
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
              </div>

              {getTotalDiscount() > 0 && (
                <div className="flex justify-between text-danger-500 font-medium px-2">
                  <span>Total Saved</span>
                  <span>-{fmt(getTotalDiscount())}</span>
                </div>
              )}

              <div className="flex justify-between text-surface-500 font-medium px-2">
                <span>Tax (GST)</span>
                <span>+{fmt(getTotalTax())}</span>
              </div>

              <div className="mt-6 pt-6 border-t-2 border-dashed border-surface-200 flex justify-between items-end">
                <span className="text-surface-500 font-bold uppercase tracking-widest text-sm mb-1">Grand Total</span>
                <span className="text-4xl font-black text-primary-600">{fmt(getGrandTotal())}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-10">
              <p className="text-xs font-black text-surface-400 mb-3 uppercase tracking-widest">Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      paymentMethod === pm.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                        : 'border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50'
                    }`}
                  >
                    <pm.icon className="w-6 h-6" />
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
