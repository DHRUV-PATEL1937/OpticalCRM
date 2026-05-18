import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import api, { productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const categoryOptions = [
  { value: 'frames', label: 'Frames' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'lenses', label: 'Lenses' },
  { value: 'contact_lenses', label: 'Contact Lenses' },
  { value: 'solutions', label: 'Solutions' },
  { value: 'accessories', label: 'Accessories' },
];

const genderOptions = [
  { value: 'unisex', label: 'Unisex' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'kids', label: 'Kids' },
];

export default function ProductForm({ product, onClose }) {
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || '',
    brand: product?.brand || '',
    model: product?.model || '',
    color: product?.color || '',
    size: product?.size || '',
    type: product?.type || '',
    material: product?.material || '',
    gender: product?.gender || 'unisex',
    costPrice: product?.costPrice || '',
    sellingPrice: product?.sellingPrice || '',
    mrp: product?.mrp || '',
    tax: product?.tax ?? 18,
    stockQuantity: product?.stockQuantity || '',
    lowStockThreshold: product?.lowStockThreshold || 5,
    description: product?.description || '',
    images: product?.images || [],
  });

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await api.post('/products/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm({ ...form, images: [...form.images, res.data.url] });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);
    setForm({ ...form, images: newImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.costPrice || !form.sellingPrice) {
      toast.error('Please fill required fields');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...form,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        mrp: Number(form.mrp) || Number(form.sellingPrice),
        tax: Number(form.tax),
        stockQuantity: Number(form.stockQuantity) || 0,
        lowStockThreshold: Number(form.lowStockThreshold),
      };

      if (isEdit) {
        await productAPI.update(product._id, data);
        toast.success('Product updated!');
      } else {
        await productAPI.create(data);
        toast.success('Product created!');
      }
      onClose(true);
    } catch (err) { /* handled by interceptor */ }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Product Name *" placeholder="e.g. Ray-Ban Aviator" value={form.name} onChange={handleChange('name')} containerClass="md:col-span-2" />
          <Select label="Category *" options={categoryOptions} value={form.category} onChange={handleChange('category')} />
          <Input label="Brand" placeholder="e.g. Ray-Ban" value={form.brand} onChange={handleChange('brand')} />
          <Input label="Model" placeholder="e.g. RB3025" value={form.model} onChange={handleChange('model')} />
          <Select label="Gender" options={genderOptions} value={form.gender} onChange={handleChange('gender')} />
        </div>
      </div>

      {/* Details */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Color" placeholder="e.g. Gold" value={form.color} onChange={handleChange('color')} />
          <Input label="Size" placeholder="e.g. 52" value={form.size} onChange={handleChange('size')} />
          <Input label="Type" placeholder="e.g. full-rim" value={form.type} onChange={handleChange('type')} />
          <Input label="Material" placeholder="e.g. Metal" value={form.material} onChange={handleChange('material')} />
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="Cost Price *" type="number" placeholder="0" value={form.costPrice} onChange={handleChange('costPrice')} />
          <Input label="Selling Price *" type="number" placeholder="0" value={form.sellingPrice} onChange={handleChange('sellingPrice')} />
          <Input label="MRP" type="number" placeholder="0" value={form.mrp} onChange={handleChange('mrp')} />
          <Input label="Tax (GST %)" type="number" placeholder="18" value={form.tax} onChange={handleChange('tax')} />
        </div>
      </div>

      {/* Stock */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Inventory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Stock Quantity" type="number" placeholder="0" value={form.stockQuantity} onChange={handleChange('stockQuantity')} />
          <Input label="Low Stock Alert At" type="number" placeholder="5" value={form.lowStockThreshold} onChange={handleChange('lowStockThreshold')} />
        </div>
      </div>

      {/* Images */}
      <div>
        <h3 className="text-sm font-semibold text-surface-700 mb-3">Images</h3>
        <div className="flex flex-wrap gap-4">
          {form.images.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-xl border border-surface-200 overflow-hidden">
              <img src={`http://localhost:5000${img}`} alt={`Product ${idx}`} className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-danger-500 hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {form.images.length < 4 && (
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-surface-200 flex flex-col items-center justify-center text-surface-500 hover:text-primary-600 hover:border-primary-300 transition-colors relative cursor-pointer bg-surface-50">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all resize-none"
          placeholder="Product description..."
          value={form.description}
          onChange={handleChange('description')}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-100">
        <Button type="button" variant="secondary" onClick={() => onClose(false)}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Update Product' : 'Create Product'}</Button>
      </div>
    </form>
  );
}
