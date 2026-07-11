import { useState } from 'react';
import { ChevronLeft, Plus, Edit, Settings, Loader2, CheckCircle2 } from 'lucide-react';
import { otopAPI } from '../../utils/api';
import { logActivity } from '../../utils/activityLogger';

interface Category {
  id: string;
  name: string;
  active: boolean;
  count: number;
  createdAt: string;
}

interface ManageCategoriesProps {
  setView: (view: any) => void;
  categories: Category[];
  onUpdate: () => void;
}

export function ManageCategories({ setView, categories, onUpdate }: ManageCategoriesProps) {
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

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600" size={20} />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Admin Notice */}
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
