'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useListCoursesQuery, useListCategoriesQuery } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Search, Star, Users, Grid3X3, List, BookOpen, SlidersHorizontal, X } from 'lucide-react';

export default function BrowseCourses() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useListCategoriesQuery();
  const { data: coursesData, isLoading, error } = useListCoursesQuery({
    page, limit: 12,
    search: search || undefined,
    category: selectedCategory || undefined,
    level: selectedLevel || undefined,
    sort,
  });

  const categories = categoriesData?.data || [];
  const courses = coursesData?.data || [];
  const meta = coursesData?.meta;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Browse Courses</h1>
          <p className="text-sm text-slate-400 mt-1">Discover courses to enhance your skills</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/[0.06] text-slate-400 hover:text-white transition-all">
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        {/* Search row */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Desktop view toggle */}
          <div className="hidden sm:flex rounded-xl border border-white/[0.06] overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-3 transition-all ${viewMode === 'list' ? 'bg-primary-500/20 text-primary-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Desktop filters */}
        <div className="hidden lg:flex gap-3">
          <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-primary-500/50 appearance-none cursor-pointer">
            <option value="" className="bg-slate-900">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.icon} {cat.name}</option>
            ))}
          </select>
          <select value={selectedLevel} onChange={(e) => { setSelectedLevel(e.target.value); setPage(1); }}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-primary-500/50 appearance-none cursor-pointer">
            <option value="" className="bg-slate-900">All Levels</option>
            <option value="beginner" className="bg-slate-900">Beginner</option>
            <option value="intermediate" className="bg-slate-900">Intermediate</option>
            <option value="advanced" className="bg-slate-900">Advanced</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-primary-500/50 appearance-none cursor-pointer">
            <option value="-createdAt" className="bg-slate-900">Newest</option>
            <option value="title" className="bg-slate-900">Name A-Z</option>
            <option value="-price" className="bg-slate-900">Price: High-Low</option>
            <option value="price" className="bg-slate-900">Price: Low-High</option>
          </select>
        </div>

        {/* Mobile filter sheet */}
        {showFilters && (
          <div className="lg:hidden p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/[0.06] space-y-3 animate-slide-down">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">Filters</p>
              <button onClick={() => setShowFilters(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm appearance-none cursor-pointer">
                <option value="" className="bg-slate-900">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                ))}
              </select>
              <select value={selectedLevel} onChange={(e) => { setSelectedLevel(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm appearance-none cursor-pointer">
                <option value="" className="bg-slate-900">All Levels</option>
                <option value="beginner" className="bg-slate-900">Beginner</option>
                <option value="intermediate" className="bg-slate-900">Intermediate</option>
                <option value="advanced" className="bg-slate-900">Advanced</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedCategory(''); setSelectedLevel(''); }} className="flex-1 px-3 py-2 rounded-xl border border-white/[0.06] text-slate-400 text-sm hover:text-white transition-all">Reset</button>
              <button onClick={() => setShowFilters(false)} className="flex-1 px-3 py-2 rounded-xl bg-primary-500/20 text-primary-400 text-sm hover:bg-primary-500/30 transition-all">Apply</button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" text="Loading courses..." /></div>
      ) : error ? (
        <Alert type="error">Failed to load courses. Is the backend running?</Alert>
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No courses found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
            : 'space-y-3'}>
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card glass hover className={viewMode === 'list' ? 'flex items-center' : ''}>
                  <CardContent className={viewMode === 'list' ? 'flex items-center gap-4 p-4 w-full' : 'p-0'}>
                    {/* Thumbnail */}
                    <div className={`${
                      viewMode === 'list' ? 'h-14 w-20 flex-shrink-0' : 'h-36 w-full'
                    } rounded-t-2xl bg-gradient-to-br from-primary-600/40 via-purple-600/30 to-cyan-600/20 flex items-center justify-center text-white/60 text-2xl font-bold overflow-hidden`}>
                      <div className="shimmer w-full h-full flex items-center justify-center">
                        {course.title?.charAt(0)}
                      </div>
                    </div>

                    <div className={viewMode === 'list' ? 'flex-1 min-w-0' : 'p-4'}>
                      <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
                        {course.title}
                      </h3>
                      {viewMode === 'grid' && course.instructor_name && (
                        <p className="text-xs text-slate-500 mt-1 truncate">{course.instructor_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 flex-wrap">
                        {course.level && (
                          <span className="capitalize px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/[0.04]">{course.level}</span>
                        )}
                        <span className="font-medium text-primary-400">{course.price === 0 ? 'Free' : `$${course.price}`}</span>
                        {viewMode === 'grid' && (
                          <>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                              {course.average_rating ? Number(course.average_rating).toFixed(1) : '0.0'}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <Users className="h-3 w-3" />
                              {course.total_students || 0}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                className="px-3.5 py-2 rounded-xl border border-white/[0.06] text-sm text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Previous
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === meta.totalPages)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-600">...</span>}
                    <button onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                        p === page ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20' : 'border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/5'
                      }`}>{p}</button>
                  </span>
                ))}
              <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page >= meta.totalPages}
                className="px-3.5 py-2 rounded-xl border border-white/[0.06] text-sm text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
