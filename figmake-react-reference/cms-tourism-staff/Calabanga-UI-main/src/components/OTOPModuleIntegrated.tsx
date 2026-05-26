import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, Edit, MoreVertical, Trash2, Check, X, Settings, Eye, Archive, AlertCircle, FileText, Loader2, CheckCircle } from 'lucide-react';
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
  count: number;
  createdAt: string;
}

export function OTOPModuleIntegrated() {
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        otopAPI.getProducts(),
        otopAPI.getCategories()
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Initialize with sample data if empty
      if (productsData.length === 0) {
        await initializeSampleData();
      }
    } catch (error) {
      console.error('Failed to load OTOP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSampleData = async () => {
    try {
      // Create categories
      const sampleCategories = [
        { name: 'Food & Beverages', active: true },
        { name: 'Handicrafts', active: true },
        { name: 'Textiles', active: true },
        { name: 'Home Decor', active: true },
      ];

      for (const cat of sampleCategories) {
        await otopAPI.createCategory(cat);
      }

      // Create sample products
      const sampleProducts = [
        { name: 'Handwoven Bamboo Basket', category: 'Handicrafts', price: '₱250-450', producer: 'Maria Santos', stockLevel: 45, status: 'Published' },
        { name: 'Organic Pili Nuts', category: 'Food & Beverages', price: '₱180-320', producer: 'Juan dela Cruz', stockLevel: 120, status: 'Published' },
        { name: 'Traditional Woven Mat', category: 'Textiles', price: '₱500-800', producer: 'Rosa Martinez', stockLevel: 28, status: 'Published' },
        { name: 'Coconut Vinegar', category: 'Food & Beverages', price: '₱80-120', producer: 'Pedro Garcia', stockLevel: 85, status: 'Pending Review' },
      ];

      for (const product of sampleProducts) {
        await otopAPI.createProduct(product);
      }

      // Reload data
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
    if (newStatus === 'Delete') {
      setShowConfirmDialog({ action: 'Delete', productId, productName });
    } else {
      setShowConfirmDialog({ action: newStatus, productId, productName });
    }
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
      } else {
        await otopAPI.updateProduct(productId, { status: action });
        await logActivity({
          action: `Product ${action.toLowerCase()}`,
          detail: `${productName} - Status changed to ${action}`,
          status: action === 'Published' ? 'success' : 'info',
          module: 'OTOP Support'
        });
      }

      // Reload data and update stats
      await loadData();
      await updateDashboardStats({
        otopProducts: products.length,
        otopTrend: `+${products.length}`
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

  if (view === 'detail' && selectedProduct) {
    return <ProductDetail product={selectedProduct} setView={setView} onUpdate={loadData} />;
  }

  if (view === 'manage-categories') {
    return <ManageCategories setView={setView} categories={categories} onUpdate={loadData} />;
  }

  if (view === 'add-product') {
    return <AddProduct setView={setView} categories={categories} onUpdate={loadData} />;
  }

  if (view === 'edit-product' && selectedProduct) {
    return <EditProduct product={selectedProduct} setView={setView} categories={categories} onUpdate={loadData} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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

// Continue in next file due to size...
