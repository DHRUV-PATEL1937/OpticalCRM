import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Package, Edit, Trash2, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';
import ProductForm from './ProductForm';

const categoryOptions = [
  { value: 'frames', label: 'Frames' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'lenses', label: 'Lenses' },
  { value: 'contact_lenses', label: 'Contact Lenses' },
  { value: 'solutions', label: 'Solutions' },
  { value: 'accessories', label: 'Accessories' },
];

const categoryColors = {
  frames: 'primary', sunglasses: 'warning', lenses: 'success',
  contact_lenses: 'premium', solutions: 'gray', accessories: 'gray',
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    loadProducts();
  }, [pagination.page, category]);

  const loadProducts = async (searchOverride) => {
    try {
      setLoading(true);
      const res = await productAPI.getAll({
        page: pagination.page,
        limit: 20,
        search: searchOverride ?? search,
        category: category || undefined,
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deactivated');
      loadProducts();
    } catch (err) { /* error handled by interceptor */ }
  };

  const handleFormClose = (saved) => {
    setShowForm(false);
    setEditProduct(null);
    if (saved) loadProducts();
  };

  const formatCurrency = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Products</h1>
          <p className="text-surface-500 text-sm mt-0.5">{pagination.total} products in catalog</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditProduct(null); setShowForm(true); }}>
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <Input
            placeholder="Search by name, SKU, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
            containerClass="flex-1 min-w-[200px]"
          />
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPagination(p => ({...p, page:1})); }}
            placeholder="All Categories"
            containerClass="w-48"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </Card>

      {/* Products Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-surface-500 border-b border-surface-100 bg-surface-50/50">
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Brand</th>
                <th className="px-6 py-3 font-medium text-right">Cost</th>
                <th className="px-6 py-3 font-medium text-right">Price</th>
                <th className="px-6 py-3 font-medium text-center">Stock</th>
                <th className="px-6 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="border-b border-surface-50">
                    {Array.from({length: 8}).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-full rounded"></div></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                    <p className="text-surface-500">No products found</p>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSearch(''); setCategory(''); loadProducts(''); }}>
                      Clear filters
                    </Button>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-surface-900">{p.name}</p>
                      {p.color && <p className="text-xs text-surface-400">{p.color} {p.size && `• ${p.size}`}</p>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-surface-500">{p.sku}</td>
                    <td className="px-6 py-4">
                      <Badge color={categoryColors[p.category]}>{p.category.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-6 py-4 text-surface-600">{p.brand || '—'}</td>
                    <td className="px-6 py-4 text-right text-surface-500">{formatCurrency(p.costPrice)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-surface-900">{formatCurrency(p.sellingPrice)}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge color={p.stockQuantity <= p.lowStockThreshold ? 'danger' : p.stockQuantity <= p.lowStockThreshold * 2 ? 'warning' : 'success'}>
                        {p.stockQuantity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors cursor-pointer" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-danger-500 transition-colors cursor-pointer" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} items)
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({...p, page: p.page - 1}))}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({...p, page: p.page + 1}))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Product Form Modal */}
      <Modal isOpen={showForm} onClose={() => handleFormClose(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <ProductForm product={editProduct} onClose={handleFormClose} />
      </Modal>
    </div>
  );
}
