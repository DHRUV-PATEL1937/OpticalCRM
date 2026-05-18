import { useState, useEffect } from 'react';
import { PackageSearch, Plus, Filter, TrendingDown, ArrowRightLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { productAPI, inventoryAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function InventoryList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => { loadInventory(); }, [search]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await productAPI.getAll({ search, limit: 50 });
      setProducts(res.data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  const handleAdjustClick = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Inventory Management</h1>
          <p className="text-surface-500 text-sm mt-0.5">Track and audit your stock levels</p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <Input 
            placeholder="Search by name, SKU, barcode..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            icon={PackageSearch} 
            containerClass="flex-1 min-w-[250px]" 
          />
          <Button variant="secondary" icon={Filter}>Filter</Button>
        </div>
      </Card>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-surface-500 border-b border-surface-100 bg-surface-50/50">
                <th className="px-6 py-4 font-medium">Product Name & SKU</th>
                <th className="px-6 py-4 font-medium">Category / Brand</th>
                <th className="px-6 py-4 font-medium">Barcode</th>
                <th className="px-6 py-4 font-medium text-center">Current Stock</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8">Loading inventory...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-surface-500">No products found matching your search.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-surface-900">{p.name}</p>
                      <p className="text-xs text-surface-400">{p.sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-surface-700 capitalize">{p.category}</p>
                      <p className="text-xs text-surface-400">{p.brand}</p>
                    </td>
                    <td className="px-6 py-4 text-surface-500 font-mono text-xs">{p.barcode || 'N/A'}</td>
                    <td className="px-6 py-4 text-center font-bold text-lg">{p.stockQuantity}</td>
                    <td className="px-6 py-4 text-center">
                      {p.stockQuantity <= p.lowStockThreshold ? (
                        <Badge color="danger" icon={TrendingDown}>Low Stock</Badge>
                      ) : (
                        <Badge color="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="secondary" size="sm" icon={ArrowRightLeft} onClick={() => handleAdjustClick(p)}>
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust Modal */}
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Adjust Stock" size="sm">
        {selectedProduct && (
          <StockAdjustForm 
            product={selectedProduct} 
            onClose={() => setShowAdjustModal(false)} 
            onSuccess={() => { setShowAdjustModal(false); loadInventory(); }} 
          />
        )}
      </Modal>
    </div>
  );
}

function StockAdjustForm({ product, onClose, onSuccess }) {
  const [type, setType] = useState('add');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('audit');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryAPI.adjustStock({
        productId: product._id,
        type,
        quantity: Number(quantity),
        reason,
        notes
      });
      toast.success('Stock adjusted successfully');
      onSuccess();
    } catch {
      toast.error('Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const calculateNewStock = () => {
    let q = Number(quantity) || 0;
    if (type === 'add') return product.stockQuantity + q;
    if (type === 'subtract') return Math.max(0, product.stockQuantity - q);
    return q;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="bg-surface-50 p-3 rounded-lg flex justify-between items-center border border-surface-200">
        <div>
          <p className="font-medium text-surface-900">{product.name}</p>
          <p className="text-xs text-surface-500">Current Stock</p>
        </div>
        <div className="text-xl font-bold text-primary-600">{product.stockQuantity}</div>
      </div>

      <Select label="Adjustment Type" value={type} onChange={(e) => setType(e.target.value)} options={[
        { value: 'add', label: 'Add Stock (+)' },
        { value: 'subtract', label: 'Subtract Stock (-)' },
        { value: 'set', label: 'Set Absolute Value (=)' }
      ]} />

      <Input label="Quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />

      <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} options={[
        { value: 'audit', label: 'Inventory Audit / Count' },
        { value: 'damage', label: 'Damaged / Broken' },
        { value: 'loss', label: 'Lost / Missing' },
        { value: 'return_to_supplier', label: 'Return to Supplier' },
        { value: 'other', label: 'Other' }
      ]} />

      <div className="p-3 bg-primary-50 text-primary-800 rounded-lg text-sm flex justify-between font-medium">
        <span>Resulting Stock:</span>
        <span className="text-lg">{calculateNewStock()}</span>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit" loading={loading}>Confirm Adjustment</Button>
      </div>
    </form>
  );
}
