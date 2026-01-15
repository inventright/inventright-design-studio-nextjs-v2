'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { toast } from 'sonner';

interface PricingTier {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  wordpressMembershipLevel: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface ProductPricing {
  id: number;
  productKey: string;
  productName: string;
  productDescription: string | null;
  category: string;
  departmentId: number | null;
  pricingTierId: number | null;
  price: string;
  currency: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  parentProductKey: string | null;
  parentProductName?: string;
  tierName?: string;
}

export default function PricingManagementPage() {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [products, setProducts] = useState<ProductPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductPricing | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddTier, setShowAddTier] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tiersRes, productsRes] = await Promise.all([
        fetch('/api/admin/pricing/tiers'),
        fetch('/api/admin/pricing/products')
      ]);

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setPricingTiers(tiersData.tiers || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (product: Partial<ProductPricing>) => {
    try {
      const url = product.id 
        ? `/api/admin/pricing/products/${product.id}`
        : '/api/admin/pricing/products';
      
      const method = product.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });

      if (res.ok) {
        toast.success(product.id ? 'Product updated successfully' : 'Product created successfully');
        fetchData();
        setEditingProduct(null);
        setShowAddProduct(false);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/admin/pricing/products/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Product deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleSaveTier = async (tier: Partial<PricingTier>) => {
    try {
      const url = tier.id 
        ? `/api/admin/pricing/tiers/${tier.id}`
        : '/api/admin/pricing/tiers';
      
      const method = tier.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tier)
      });

      if (res.ok) {
        toast.success(tier.id ? 'Tier updated successfully' : 'Tier created successfully');
        fetchData();
        setShowAddTier(false);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save tier');
      }
    } catch (error) {
      console.error('Error saving tier:', error);
      toast.error('Failed to save tier');
    }
  };

  const handleDeleteTier = async (id: number, tierName: string) => {
    if (!confirm(`Are you sure you want to delete the "${tierName}" pricing tier? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/pricing/tiers/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Pricing tier deleted successfully');
        if (selectedTier === id) {
          setSelectedTier(null);
        }
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete tier');
      }
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast.error('Failed to delete tier');
    }
  };

  const filteredProducts = selectedTier === null 
    ? products.filter(p => p.pricingTierId === null)
    : products.filter(p => p.pricingTierId === selectedTier);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="pt-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">Loading pricing data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <div className="pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Management</h1>
            <p className="text-gray-600">Manage product pricing and pricing tiers</p>
          </div>

          {/* Pricing Tiers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Pricing Tiers</h2>
              <button
                onClick={() => setShowAddTier(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Tier
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedTier(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTier === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Default Pricing
              </button>
              {pricingTiers.map(tier => (
                <div key={tier.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedTier(tier.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedTier === tier.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tier.displayName}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTier(tier.id, tier.displayName);
                    }}
                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={`Delete ${tier.displayName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Products {selectedTier === null ? '(Default Pricing)' : `(${pricingTiers.find(t => t.id === selectedTier)?.displayName})`}
              </h2>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No products found for this pricing tier
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{product.productName}</div>
                            <div className="text-sm text-gray-500">{product.productKey}</div>
                            {product.parentProductName && (
                              <div className="text-xs text-blue-600 mt-1">
                                Add-on for: {product.parentProductName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900 font-medium">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add Product Modal */}
      {(editingProduct || showAddProduct) && (
        <ProductModal
          product={editingProduct}
          pricingTiers={pricingTiers}
          selectedTier={selectedTier}
          onSave={handleSaveProduct}
          onClose={() => {
            setEditingProduct(null);
            setShowAddProduct(false);
          }}
        />
      )}

      {/* Add Tier Modal */}
      {showAddTier && (
        <TierModal
          onSave={handleSaveTier}
          onClose={() => setShowAddTier(false)}
        />
      )}
    </div>
  );
}

function ProductModal({ 
  product, 
  pricingTiers, 
  selectedTier,
  onSave, 
  onClose 
}: { 
  product: ProductPricing | null;
  pricingTiers: PricingTier[];
  selectedTier: number | null;
  onSave: (product: Partial<ProductPricing>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<ProductPricing>>(
    product || {
      productKey: '',
      productName: '',
      productDescription: '',
      category: 'addon',
      price: '0.00',
      currency: 'USD',
      pricingTierId: selectedTier,
      isActive: true
    }
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {product ? 'Edit Product' : 'Add Product'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Key *
              </label>
              <input
                type="text"
                value={formData.productKey}
                onChange={(e) => setFormData({ ...formData, productKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., sell_sheets, rush_delivery"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Sell Sheets, Rush Delivery"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.productDescription || ''}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="department">Department</option>
                  <option value="addon">Add-on</option>
                  <option value="rush">Rush</option>
                  <option value="revision">Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Tier
              </label>
              <select
                value={formData.pricingTierId || ''}
                onChange={(e) => setFormData({ ...formData, pricingTierId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Default Pricing</option>
                {pricingTiers.map(tier => (
                  <option key={tier.id} value={tier.id}>{tier.displayName}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TierModal({ 
  onSave, 
  onClose 
}: { 
  onSave: (tier: Partial<PricingTier>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<PricingTier>>({
    name: '',
    displayName: '',
    description: '',
    wordpressMembershipLevel: '',
    isActive: true,
    sortOrder: 0
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Add Pricing Tier
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier Name (slug) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., premium, vip"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Premium Member, VIP Member"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WordPress Membership Level
              </label>
              <input
                type="text"
                value={formData.wordpressMembershipLevel || ''}
                onChange={(e) => setFormData({ ...formData, wordpressMembershipLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty to configure later"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
