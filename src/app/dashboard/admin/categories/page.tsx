'use client';

import { useState } from 'react';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import toast from 'react-hot-toast';
import { cn, timeAgo } from '@/lib/utils';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const { data, isLoading, error } = useListCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  const categories = data?.data || [];

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Category name is required'); return; }
    try {
      await createCategory({ name: name.trim(), description: description.trim() || undefined, icon: icon.trim() || undefined }).unwrap();
      toast.success('Category created');
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    try {
      await updateCategory({ id: editingId, data: { name: name.trim(), description: description.trim() || undefined, icon: icon.trim() || undefined } }).unwrap();
      toast.success('Category updated');
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Delete category "${catName}"? Courses in this category will lose their category.`)) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success(`Category "${catName}" deleted`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete category');
    }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIcon(cat.icon || '');
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <p className="text-sm text-slate-400 mt-0.5">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={resetForm} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-all"
                  placeholder="e.g., Web Development"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-all resize-none"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Icon (optional)</label>
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-all"
                  placeholder="Icon name or emoji"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium transition-all">
                  <Check className="h-4 w-4" />
                  {isCreating ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert type="error">Failed to load categories.</Alert>
      ) : categories.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <FolderTree className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No categories yet</h3>
            <p className="text-sm text-slate-500">Create your first category to organize courses</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat: any) => (
            <Card key={cat.id} glass hover>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center text-lg flex-shrink-0">
                      {cat.icon || cat.name?.charAt(0) || '📁'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{cat.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">Created {timeAgo(cat.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-white/10 transition-all">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
