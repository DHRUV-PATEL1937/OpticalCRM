import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  paymentMethod: 'cash',
  discount: 0,
  notes: '',

  addItem: (product) => {
    const items = get().items;
    const existing = items.find((i) => i.product === product._id);
    if (existing) {
      set({
        items: items.map((i) => {
          if (i.product === product._id) {
            const newQty = i.quantity + 1;
            return { ...i, quantity: newQty, total: newQty * (i.unitPrice + (i.glassDetails?.price || 0)) - i.discount };
          }
          return i;
        }),
      });
    } else {
      set({
        items: [
          ...items,
          {
            product: product._id,
            productName: product.name,
            productSku: product.sku,
            quantity: 1,
            unitPrice: product.sellingPrice,
            discount: 0,
            tax: product.tax || 0,
            total: product.sellingPrice,
            maxStock: product.stockQuantity,
            hasPrescription: false,
            prescriptionDetails: {
              rightEye: { sph: '', cyl: '', axis: '', add: '', va: '' },
              leftEye: { sph: '', cyl: '', axis: '', add: '', va: '' },
              pd: '',
            },
            glassDetails: { name: '', price: 0 },
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product !== productId) });
  },

  updateItemQuantity: (productId, quantity) => {
    set({
      items: get().items.map((i) => {
        if (i.product === productId) {
          const newQty = Math.max(1, quantity);
          return { ...i, quantity: newQty, total: newQty * (i.unitPrice + (i.glassDetails?.price || 0)) - i.discount };
        }
        return i;
      }),
    });
  },

  updateItemDiscount: (productId, discount) => {
    set({
      items: get().items.map((i) => {
        if (i.product === productId) {
          return { ...i, discount, total: i.quantity * (i.unitPrice + (i.glassDetails?.price || 0)) - discount };
        }
        return i;
      }),
    });
  },

  updateItemPrescription: (productId, hasPrescription, prescriptionDetails, glassDetails) => {
    set({
      items: get().items.map((i) => {
        if (i.product === productId) {
          return {
            ...i,
            hasPrescription,
            prescriptionDetails,
            glassDetails,
            total: i.quantity * (i.unitPrice + (glassDetails?.price || 0)) - i.discount
          };
        }
        return i;
      })
    });
  },

  setCustomer: (customer) => set({ customer }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setDiscount: (discount) => set({ discount }),
  setNotes: (notes) => set({ notes }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.quantity * (i.unitPrice + (i.glassDetails?.price || 0)), 0),
  getTotalDiscount: () => get().items.reduce((sum, i) => sum + i.discount, 0) + get().discount,
  getTotalTax: () => {
    return get().items.reduce((sum, i) => {
      const itemTotal = i.quantity * (i.unitPrice + (i.glassDetails?.price || 0)) - i.discount;
      return sum + (itemTotal * i.tax) / 100;
    }, 0);
  },
  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const totalDiscount = get().getTotalDiscount();
    const totalTax = get().getTotalTax();
    return subtotal - totalDiscount + totalTax;
  },

  clearCart: () => set({ items: [], customer: null, paymentMethod: 'cash', discount: 0, notes: '' }),
}));

export default useCartStore;
