'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGetCourseBySlugQuery, useEnrollCourseMutation, useGetCourseReviewsQuery } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Star, Users, Clock, Globe, BookOpen, CheckCircle, ChevronRight, Heart, Sparkles, PlayCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [enrollCourse, { isLoading: isEnrolling }] = useEnrollCourseMutation();

  const { data, isLoading, error } = useGetCourseBySlugQuery(slug);
  const courseId = data?.data?.id;
  const { data: reviewsData } = useGetCourseReviewsQuery(courseId!, { skip: !courseId, limit: 10 });

  const handleEnroll = async () => {
    if (!course?.id) return;
    try {
      await enrollCourse({ courseId: course.id }).unwrap();
      toast.success('Successfully enrolled! Check your dashboard.', {
        style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
      });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Enrollment failed. Please try again.', {
        style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
      });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><Spinner size="lg" text="Loading course..." /></div>;
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="max-w-md w-full px-4">
          <Alert type="error">Could not load this course.</Alert>
          <div className="mt-4 text-center">
            <Link href="/dashboard/browse" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">← Back to Browse</Link>
          </div>
        </div>
      </div>
    );
  }

  const course = data.data;

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Back nav */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link href="/dashboard/browse" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Browse
        </Link>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-purple-900/20 to-slate-950" />
        <div className="absolute top-20 -left-20 h-72 w-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-20 h-96 w-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                {course.category_name && <span className="badge-published text-xs">{course.category_name}</span>}
                {course.level && <span className="badge-pending text-xs capitalize">{course.level}</span>}
              </div>

              <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">{course.title}</h1>
              {course.subtitle && <p className="text-base text-slate-300 leading-relaxed">{course.subtitle}</p>}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                {course.avg_rating > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/10 text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" /> {Number(course.avg_rating).toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.student_count || 0} students</span>
                {course.duration_hours && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.duration_hours}h</span>}
                {course.language && <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> {course.language}</span>}
                {(course.total_lessons ?? 0) > 0 && <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {course.total_lessons || 0} lessons</span>}
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg">
                  {course.instructor_name?.charAt(0) || 'I'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{course.instructor_name}</p>
                  {course.instructor_headline && <p className="text-xs text-slate-500">{course.instructor_headline}</p>}
                </div>
              </div>
            </div>

            {/* Right - Price & CTA */}
            <div className="lg:col-span-1">
              <Card glass className="sticky top-24">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">{course.price === 0 ? 'Free' : `$${course.price}`}</p>
                    {(course.price ?? 0) > 0 && <p className="text-xs text-slate-500">One-time payment</p>}
                  </div>
                  <Button onClick={handleEnroll} isLoading={isEnrolling} className="w-full" size="lg">
                    <Sparkles className="h-4 w-4" />
                    Enroll Now
                  </Button>
                  <p className="text-xs text-slate-500 text-center">30-day money-back guarantee</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {course.description && (
              <Card glass>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">About This Course</h2>
                  <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">{course.description}</p>
                </CardContent>
              </Card>
            )}

            {/* What You'll Learn */}
            {course.what_you_learn && course.what_you_learn.length > 0 && (
              <Card glass>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">What You&apos;ll Learn</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.what_you_learn.map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {course.prerequisites && (
              <Card glass>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">Prerequisites</h2>
                  <p className="text-sm text-slate-300">{course.prerequisites}</p>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviewsData?.data && reviewsData.data.length > 0 && (
              <Card glass>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-amber-400" />
                    <h2 className="text-lg font-semibold text-white">Student Reviews</h2>
                  </div>
                  <div className="space-y-4">
                    {reviewsData.data.map((review: any) => (
                      <div key={review.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < review.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{review.comment}</p>
                        <p className="text-xs text-slate-500 mt-2">by {review.reviewer_name || 'Anonymous'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Content */}
            <Card glass>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Course Content</h2>
                  <span className="text-sm text-slate-500">{course.total_lessons || 0} lessons</span>
                </div>
                {course.lessons && course.lessons.length > 0 ? (
                  <div className="space-y-1">
                    {course.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/lessons/${lesson.id}`}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-primary-500/20 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn(
                            'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                            lesson.content_type === 'video' ? 'bg-blue-500/10' :
                            lesson.content_type === 'quiz' ? 'bg-amber-500/10' :
                            'bg-primary-500/10'
                          )}>
                            {lesson.content_type === 'video' ? (
                              <PlayCircle className="h-4 w-4 text-blue-400" />
                            ) : lesson.content_type === 'quiz' ? (
                              <BookOpen className="h-4 w-4 text-amber-400" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-primary-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">{lesson.title}</p>
                            <p className="text-xs text-slate-500 capitalize">{lesson.content_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lesson.is_free_preview && <span className="badge-published text-[10px] px-2 py-0.5">Free</span>}
                          {lesson.duration_minutes > 0 && <span className="text-xs text-slate-500">{lesson.duration_minutes} min</span>}
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-primary-400 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-6 text-center">Course content is being built</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card glass>
              <CardContent className="p-6">
                <h3 className="font-semibold text-white mb-4">Instructor</h3>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white">
                    {course.instructor_name?.charAt(0) || 'I'}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{course.instructor_name}</p>
                    {course.instructor_headline && <p className="text-xs text-slate-500">{course.instructor_headline}</p>}
                  </div>
                </div>
                {course.instructor_bio && <p className="text-sm text-slate-400 mt-4 leading-relaxed">{course.instructor_bio}</p>}
              </CardContent>
            </Card>

            {course.tags && course.tags.length > 0 && (
              <Card glass>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-white mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-slate-400">{tag}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
