'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetCourseByIdQuery, useUpdateCourseMutation, useListCategoriesQuery, useUploadThumbnailMutation } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Save, Upload, Image } from 'lucide-react';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const { data: courseData, isLoading: courseLoading, error: courseError } = useGetCourseByIdQuery(courseId);
  const { data: categoriesData } = useListCategoriesQuery();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const [uploadThumbnail, { isLoading: isUploadingThumb }] = useUploadThumbnailMutation();

  const categories = categoriesData?.data || [];
  const course = courseData?.data;

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

  // Populate form when course data loads
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        subtitle: course.subtitle || '',
        description: course.description || '',
        // Use category_id from the raw course data (findById returns the full row)
      categoryId: (course as any).category_id || '',
        level: course.level || 'beginner',
        price: course.price || 0,
        language: course.language || 'English',
        prerequisites: course.prerequisites || '',
        whatYouLearn: (course.what_you_learn && course.what_you_learn.length > 0) ? course.what_you_learn : [''],
        tags: (course.tags && course.tags.length > 0) ? course.tags : [''],
      });
    }
  }, [course]);

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

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !course) return;
    try {
      await uploadThumbnail({ courseId: course.id, file }).unwrap();
      toast.success('Thumbnail uploaded successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload thumbnail');
    }
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
      await updateCourse({
        id: courseId,
        data: {
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
        },
      }).unwrap();

      toast.success('Course updated successfully!');
      router.push('/dashboard/courses');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update course');
    }
  };

  if (!user) return <Spinner size="lg" />;

  if (courseLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-800/40 animate-shimmer rounded-lg" />
        <SkeletonList rows={6} />
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Alert type="error">Course not found or you don't have access.</Alert>
        <Link href="/dashboard/courses" className="text-sm text-primary-400 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to My Courses
          </Link>
          <h1 className="text-xl font-bold gradient-text-purple">Edit Course</h1>
          <p className="text-sm text-slate-400 mt-0.5">Update your course information</p>
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
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all"
              />
              {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Subtitle</label>
              <input
                value={formData.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-500 text-sm focus:border-primary-500/30 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
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
                  type="number" min="0" step="0.01"
                  value={formData.price}
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
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

        {/* Thumbnail */}
        <Card glass>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Course Thumbnail</h2>
            <div className="flex items-start gap-4">
              {(course as any).thumbnail_url ? (
                <div className="relative h-32 w-48 rounded-xl overflow-hidden border border-white/[0.08] flex-shrink-0">
                  <img
                    src={(course as any).thumbnail_url}
                    alt="Course thumbnail"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 w-48 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.12] flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <Image className="h-8 w-8 text-slate-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">No thumbnail</p>
                  </div>
                </div>
              )}
              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 hover:bg-white/[0.08] hover:border-primary-500/20 transition-all cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {isUploadingThumb ? 'Uploading...' : 'Upload New Thumbnail'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailUpload}
                    disabled={isUploadingThumb}
                  />
                </label>
                <p className="text-xs text-slate-500 mt-2">Recommended: 1280x720px, JPG or PNG, max 5MB</p>
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
          <Button type="submit" isLoading={isUpdating}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
