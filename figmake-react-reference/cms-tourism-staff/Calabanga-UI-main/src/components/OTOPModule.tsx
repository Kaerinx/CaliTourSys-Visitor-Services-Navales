import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, Edit, MoreVertical, Trash2, Check, X, Settings, Eye, Archive, AlertCircle, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { otopAPI } from '../utils/api';
import { logActivity, updateDashboardStats } from '../utils/activityLogger';

type OTOPView = 'catalog' | 'detail' | 'manage-categories' | 'add-product' | 'edit-product';
type ProductStatus = 'Published' | 'Pending Review' | 'Draft' | 'Archived';

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  producer: string;
  description?: string;
  stockLevel: number;
  status: ProductStatus;
  submittedDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
  count?: number;
  createdAt: string;
}

export function OTOPModule() {
  const [view, setView] = useState<OTOPView>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ action: string; productId: string; productName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        otopAPI.getProducts(),
        otopAPI.getCategories()
      ]);
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      // Initialize with sample data if empty
      if ((!productsData || productsData.length === 0) && (!categoriesData || categoriesData.length === 0)) {
        await initializeSampleData();
      }
    } catch (error) {
      console.error('Failed to load OTOP data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeSampleData = async () => {
    try {
      const sampleCategories = [
        { name: 'Food & Beverages', active: true },
        { name: 'Handicrafts', active: true },
        { name: 'Textiles', active: true },
        { name: 'Home Decor', active: true },
      ];

      const createdCategories = [];
      for (const cat of sampleCategories) {
        const result = await otopAPI.createCategory(cat);
        createdCategories.push(result);
      }

      const sampleProducts = [
        { name: 'Handwoven Bamboo Basket', category: 'Handicrafts', price: '₱250-450', producer: 'Maria Santos', description: 'Traditional handwoven basket', stockLevel: 45, status: 'Published' },
        { name: 'Organic Pili Nuts', category: 'Food & Beverages', price: '₱180-320', producer: 'Juan dela Cruz', description: 'Locally sourced organic pili nuts', stockLevel: 120, status: 'Published' },
        { name: 'Traditional Woven Mat', category: 'Textiles', price: '₱500-800', producer: 'Rosa Martinez', description: 'Handcrafted traditional mat', stockLevel: 28, status: 'Published' },
        { name: 'Coconut Vinegar', category: 'Food & Beverages', price: '₱80-120', producer: 'Pedro Garcia', description: 'Pure coconut vinegar', stockLevel: 85, status: 'Pending Review' },
      ];

      for (const product of sampleProducts) {
        await otopAPI.createProduct(product);
      }

      await loadData();
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || product.status === selectedStatus;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.producer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (productId: string, newStatus: string, productName: string) => {
    setShowConfirmDialog({ action: newStatus, productId, productName });
  };

  const confirmStatusChange = async () => {
    if (!showConfirmDialog) return;

    try {
      setActionLoading(true);
      const { action, productId, productName } = showConfirmDialog;

      if (action === 'Delete') {
        await otopAPI.deleteProduct(productId);
        await logActivity({
          action: 'Product deleted',
          detail: `${productName} removed from catalog`,
          status: 'warning',
          module: 'OTOP Support'
        });
        showSuccess('Product deleted successfully');
      } else {
        await otopAPI.updateProduct(productId, { status: action });
        await logActivity({
          action: `Product ${action.toLowerCase()}`,
          detail: `${productName} - Status changed to ${action}`,
          status: action === 'Published' ? 'success' : 'info',
          module: 'OTOP Support'
        });
        showSuccess(`Product status updated to ${action}`);
      }

      await loadData();
      const updatedProducts = await otopAPI.getProducts();
      await updateDashboardStats({
        otopProducts: updatedProducts.length,
        otopTrend: `+${updatedProducts.filter((p: any) => {
          const createdDate = new Date(p.createdAt);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return createdDate > oneMonthAgo;
        }).length}`
      });

      setShowConfirmDialog(null);
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Error updating product status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading OTOP products...</p>
        </div>
      </div>
    );
  }

  if (view === 'manage-categories') {
    return <ManageCategories setView={setView} categories={categories} onUpdate={loadData} />;
  }

  if (view === 'add-product') {
    return <AddProduct setView={setView} categories={categories} onUpdate={loadData} onSuccess={showSuccess} />;
  }

  if (view === 'edit-product' && selectedProduct) {
    return <EditProduct product={selectedProduct} setView={setView} categories={categories} onUpdate={loadData} onSuccess={showSuccess} />;
  }

  if (view === 'detail' && selectedProduct) {
    return <ProductDetail product={selectedProduct} setView={setView} onEdit={() => setView('edit-product')} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={20} />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl">OTOP Product Management</h2>
          <p className="text-sm text-slate-600">Review and manage submitted OTOP product records ({products.length} total)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('manage-categories')}
            className="bg-slate-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Settings size={20} />
            <span className="hidden md:inline">Categories</span>
          </button>
          <button 
            onClick={() => setView('add-product')}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search by product name or producer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-2 text-slate-700">Product Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c.active).map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-2 text-slate-700">Product Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Showing {filteredProducts.length} of {products.length} products</span>
        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
          {products.filter(p => p.status === 'Pending Review').length} pending review
        </span>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Producer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Price Range</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Officer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">Stock: {product.stockLevel} units</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{product.producer}</td>
                  <td className="px-4 py-3 text-sm text-green-700">{product.price}</td>
                  <td className="px-4 py-3">{getProductStatusBadge(product.status)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {new Date(product.submittedDate || product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setView('detail');
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setView('edit-product');
                        }}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit size={18} className="text-green-600" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === product.id ? null : product.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          aria-label="More Actions"
                        >
                          <MoreVertical size={18} className="text-slate-600" />
                        </button>
                        {showActionMenu === product.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                            <button
                              onClick={() => handleStatusChange(product.id, 'Published', product.name)}
                              className="w-full px-4 py-2 text-left hover:bg-green-50 text-green-700 flex items-center gap-2 text-sm"
                              disabled={product.status === 'Published'}
                            >
                              <Check size={16} />
                              Approve & Publish
                            </button>
                            <button
                              onClick={() => handleStatusChange(product.id, 'Draft', product.name)}
                              className="w-full px-4 py-2 text-left hover:bg-yellow-50 text-yellow-700 flex items-center gap-2 text-sm"
                            >
                              <FileText size={16} />
                              Move to Draft
                            </button>
                            <button
                              onClick={() => handleStatusChange(product.id, 'Archived', product.name)}
                              className="w-full px-4 py-2 text-left hover:bg-orange-50 text-orange-700 flex items-center gap-2 text-sm border-t border-slate-200"
                            >
                              <Archive size={16} />
                              Archive Product
                            </button>
                            <button
                              onClick={() => handleStatusChange(product.id, 'Delete', product.name)}
                              className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-700 flex items-center gap-2 text-sm"
                            >
                              <Trash2 size={16} />
                              Delete Permanently
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p>No products found matching your criteria.</p>
          {products.length === 0 && (
            <button
              onClick={() => setView('add-product')}
              className="mt-4 text-blue-600 hover:text-blue-700 underline"
            >
              Add your first product
            </button>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg">Confirm Officer Action</h3>
            <p className="text-slate-600">
              Are you sure you want to {showConfirmDialog.action === 'Delete' ? 'permanently delete' : 'change status to'} 
              {showConfirmDialog.action !== 'Delete' && <strong> {showConfirmDialog.action}</strong>}?
            </p>
            <p className="text-sm text-slate-600">
              Product: <strong>{showConfirmDialog.productName}</strong>
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              ⚠️ This action will update the product record and may affect public visibility.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 border border-slate-300 py-3 rounded-lg hover:bg-slate-50"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={actionLoading}
                className={`flex-1 ${showConfirmDialog.action === 'Delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getProductStatusBadge(status: ProductStatus) {
  const badges = {
    'Published': <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
      <Check size={12} /> Published
    </span>,
    'Pending Review': <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
      <AlertCircle size={12} /> Pending Review
    </span>,
    'Draft': <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full w-fit">
      Draft
    </span>,
    'Archived': <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
      <Archive size={12} /> Archived
    </span>,
  };
  return badges[status];
}

// Sub-components continue...
interface ManageCategoriesProps {
  setView: (view: OTOPView) => void;
  categories: Category[];
  onUpdate: () => void;
}

function ManageCategories({ setView, categories, onUpdate }: ManageCategoriesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      await otopAPI.createCategory({
        name: newCatName.trim(),
        active: true
      });

      await logActivity({
        action: 'Category created',
        detail: `New category: ${newCatName}`,
        status: 'success',
        module: 'OTOP Support'
      });

      setNewCatName('');
      setShowAddForm(false);
      showSuccess('Category added successfully!');
      await onUpdate();
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('Error adding category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, name: string, currentActive: boolean) => {
    try {
      setLoading(true);
      await otopAPI.updateCategory(id, { active: !currentActive });

      await logActivity({
        action: `Category ${!currentActive ? 'activated' : 'deactivated'}`,
        detail: name,
        status: 'info',
        module: 'OTOP Support'
      });

      showSuccess(`Category ${!currentActive ? 'activated' : 'deactivated'} successfully!`);
      await onUpdate();
    } catch (error) {
      console.error('Failed to toggle category:', error);
      alert('Error updating category');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) {
      alert('Please enter a valid category name');
      return;
    }

    try {
      setLoading(true);
      await otopAPI.updateCategory(editingId, { name: editingName.trim() });

      await logActivity({
        action: 'Category updated',
        detail: `Renamed to: ${editingName}`,
        status: 'success',
        module: 'OTOP Support'
      });

      setEditingId(null);
      setEditingName('');
      showSuccess('Category updated successfully!');
      await onUpdate();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Error updating category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('catalog')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Product Management
      </button>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={20} />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sky-800 mb-2">
          <Settings size={20} />
          <p className="font-medium">Officer Category Management</p>
        </div>
        <p className="text-sm text-sky-700">
          Add, edit, or deactivate product categories. Changes will affect how products are organized in the system.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl mb-2">Manage Product Categories</h2>
            <p className="text-slate-600">Organize OTOP products by category ({categories.length} total)</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
            disabled={loading}
          >
            <Plus size={20} />
            Add Category
          </button>
        </div>

        {showAddForm && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="block text-sm mb-2 text-slate-700">New Category Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g., Processed Foods"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                onClick={handleAddCategory}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewCatName('');
                }}
                className="border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className={`flex items-center justify-between p-4 rounded-lg border ${
              cat.active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex-1">
                {editingId === cat.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="px-3 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    disabled={loading}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                  />
                ) : (
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-sm text-slate-600">{cat.count || 0} products</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingId === cat.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingName('');
                      }}
                      className="border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Category"
                      disabled={loading}
                    >
                      <Edit size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(cat.id, cat.name, cat.active)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        cat.active 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      disabled={loading}
                    >
                      {cat.active ? 'Active' : 'Inactive'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No categories yet. Add your first category above.</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p>ℹ️ <strong>Note:</strong> Deactivating a category will hide it from listings but won't delete existing products.</p>
        </div>
      </div>
    </div>
  );
}

// Add Product and Edit Product components continue in the same file...
interface AddProductProps {
  setView: (view: OTOPView) => void;
  categories: Category[];
  onUpdate: () => void;
  onSuccess: (message: string) => void;
}

function AddProduct({ setView, categories, onUpdate, onSuccess }: AddProductProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: categories.find(c => c.active)?.name || '',
    price: '',
    producer: '',
    description: '',
    stockLevel: 0,
    status: 'Draft' as ProductStatus,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.producer.trim()) {
      alert('Please fill in required fields: Product Name and Producer');
      return;
    }

    try {
      setLoading(true);
      await otopAPI.createProduct(formData);

      await logActivity({
        action: 'Product created',
        detail: `${formData.name} added to catalog`,
        status: 'success',
        module: 'OTOP Support'
      });

      await onUpdate();
      const products = await otopAPI.getProducts();
      await updateDashboardStats({
        otopProducts: products.length,
        otopTrend: `+${products.length}`
      });

      onSuccess('Product created successfully!');
      setView('catalog');
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Error adding product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('catalog')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Product Management
      </button>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sky-800 mb-2">
          <Plus size={20} />
          <p className="font-medium">Officer Product Editor</p>
        </div>
        <p className="text-sm text-sky-700">
          Add new product details, set pricing, manage stock levels, and choose publication status.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Add New Product</h2>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
            {loading ? 'Saving...' : 'Add Product'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Handwoven Bamboo Basket"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {categories.filter(c => c.active).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-700">Price Range</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ₱250-450"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Producer Name *</label>
              <input
                type="text"
                value={formData.producer}
                onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Maria Santos"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-700">Stock Level</label>
              <input
                type="number"
                value={formData.stockLevel}
                onChange={(e) => setFormData({ ...formData, stockLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Product description..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Publication Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="Published">Published</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditProductProps {
  product: Product;
  setView: (view: OTOPView) => void;
  categories: Category[];
  onUpdate: () => void;
  onSuccess: (message: string) => void;
}

function EditProduct({ product, setView, categories, onUpdate, onSuccess }: EditProductProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    price: product.price,
    producer: product.producer,
    description: product.description || '',
    stockLevel: product.stockLevel,
    status: product.status,
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!formData.name.trim() || !formData.producer.trim()) {
      alert('Please fill in required fields: Product Name and Producer');
      return;
    }

    try {
      setLoading(true);
      await otopAPI.updateProduct(product.id, formData);

      await logActivity({
        action: 'Product updated',
        detail: `${formData.name} modified`,
        status: 'success',
        module: 'OTOP Support'
      });

      await onUpdate();
      onSuccess('Product updated successfully!');
      setView('catalog');
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Error updating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('catalog')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Product Management
      </button>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sky-800 mb-2">
          <Edit size={20} />
          <p className="font-medium">Edit Product</p>
        </div>
        <p className="text-sm text-sky-700">
          Update product details and manage publication status.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Edit Product</h2>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} />}
            {loading ? 'Updating...' : 'Update Product'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-slate-700">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {categories.filter(c => c.active).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-700">Price Range</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-slate-700">Producer Name *</label>
              <input
                type="text"
                value={formData.producer}
                onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-slate-700">Stock Level</label>
              <input
                type="number"
                value={formData.stockLevel}
                onChange={(e) => setFormData({ ...formData, stockLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-slate-700">Publication Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="Published">Published</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductDetailProps {
  product: Product;
  setView: (view: OTOPView) => void;
  onEdit: () => void;
}

function ProductDetail({ product, setView, onEdit }: ProductDetailProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <button
        onClick={() => setView('catalog')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft size={20} />
        Back to Product Management
      </button>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 p-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <div className="inline-block">{getProductStatusBadge(product.status)}</div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">{product.name}</h2>
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit size={18} />
              Edit Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Category</p>
              <p className="font-medium">{product.category}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Producer</p>
              <p className="font-medium">{product.producer}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Price Range</p>
              <p className="font-medium text-green-700">{product.price}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Stock Level</p>
              <p className="font-medium">{product.stockLevel} units</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Submitted Date</p>
              <p className="font-medium">{new Date(product.submittedDate || product.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Last Updated</p>
              <p className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {product.description && (
            <div>
              <p className="text-sm text-slate-600 mb-1">Description</p>
              <p className="text-slate-800">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
