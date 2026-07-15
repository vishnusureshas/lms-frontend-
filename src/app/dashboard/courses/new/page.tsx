'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateCourseMutation, useListCategoriesQuery } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Sparkles } from 'lucide-react';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [createCourse, { isLoading }] = useCreateCourseMutation();
  const { data: categoriesData } = useListCategoriesQuery();

  const categories = categoriesData?.data || [];

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    categoryId: '',
    level: 'beginner',
    price: 0,
    language: 'English',
    prerequisites: '',
    whatYouLearn: [''],
    tags: [''],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleArrayChange = (field: 'whatYouLearn' | 'tags', index: number, value: string) => {
    const arr = [...formData[field]];
    arr[index] = value;
    updateField(field, arr);
  };

  const addArrayItem = (field: 'whatYouLearn' | 'tags') => {
    updateField(field, [...formData[field], '']);
  };

  const removeArrayItem = (field: 'whatYouLearn' | 'tags', index: number) => {
    const arr = formData[field].filter((_: string, i: number) => i !== index);
    updateField(field, arr.length ? arr : ['']);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    else if (formData.title.length < 3) errs.title = 'Title must be at least 3 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await createCourse({
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId || undefined,
        level: formData.level,
        price: formData.price,
        language: formData.language,
        prerequisites: formData.prerequisites.trim(),
        whatYouLearn: formData.whatYouLearn.filter(w => w.trim()),
        tags: formData.tags.filter(t => t.trim()),
      }).unwrap();

      toast.success('Course created successfully!');
      router.push(`/courses/${result.data.slug}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create course');
    }
  };

  if (!user) return <Spinner size="lg" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to My Courses
          </Link>
          <h1 className="text-xl font-bold gradient-text-purple">Create New Course</h1>
          <p className="text-sm text-slate-400 mt-0.5">Fill in the details to create your course</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card glass>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Course Title *</label>
              <input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Complete Python Bootcamp"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all"
              />
              {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Subtitle</label>
              <input
                value={formData.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                placeholder="A brief tagline for your course"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe what your course is about..."
                rows={5}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card glass>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Classification</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:border-primary-500/30 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Select a category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => updateField('level', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:border-primary-500/30 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="beginner" className="bg-slate-900">Beginner</option>
                  <option value="intermediate" className="bg-slate-900">Intermediate</option>
                  <option value="advanced" className="bg-slate-900">Advanced</option>
                  <option value="all-levels" className="bg-slate-900">All Levels</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                  placeholder="0 = Free"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:border-primary-500/30 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="English" className="bg-slate-900">English</option>
                  <option value="Spanish" className="bg-slate-900">Spanish</option>
                  <option value="French" className="bg-slate-900">French</option>
                  <option value="Arabic" className="bg-slate-900">Arabic</option>
                  <option value="Hindi" className="bg-slate-900">Hindi</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Objectives */}
        <Card glass>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">What You'll Learn</h2>
            {formData.whatYouLearn.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={item}
                  onChange={(e) => handleArrayChange('whatYouLearn', i, e.target.value)}
                  placeholder={`Learning objective ${i + 1}`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all"
                />
                <button type="button" onClick={() => removeArrayItem('whatYouLearn', i)} className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('whatYouLearn')} className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors">
              <Plus className="h-4 w-4" /> Add objective
            </button>
          </CardContent>
        </Card>

        {/* Prerequisites & Tags */}
        <Card glass>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Prerequisites</h2>
            <textarea
              value={formData.prerequisites}
              onChange={(e) => updateField('prerequisites', e.target.value)}
              placeholder="What should students know before taking this course?"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all resize-none"
            />

            <h2 className="text-base font-semibold text-white pt-2">Tags</h2>
            {formData.tags.map((tag, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={tag}
                  onChange={(e) => handleArrayChange('tags', i, e.target.value)}
                  placeholder={`Tag ${i + 1}`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all"
                />
                <button type="button" onClick={() => removeArrayItem('tags', i)} className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('tags')} className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors">
              <Plus className="h-4 w-4" /> Add tag
            </button>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/courses">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isLoading}>
            <Sparkles className="h-4 w-4" />
            Create Course
          </Button>
        </div>
      </form>
    </div>
  );
}
