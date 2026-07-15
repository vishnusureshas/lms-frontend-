'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetLessonQuery, useCompleteLessonMutation, useGetCourseLessonsQuery, useGetCompletionStatusQuery } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle, Clock, BookOpen,
  FileText, Video, ChevronRight, ChevronLeft,
  Target, Zap,  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const contentTypeIcons: Record<string, any> = {
  video: Video,
  article: FileText,
  pdf: FileText,
  quiz: Target,
  assignment: BookOpen,
  resource: BookOpen
};

const contentTypeLabels: Record<string, string> = {
  video: 'Video Lesson',
  article: 'Article',
  pdf: 'PDF Document',
  quiz: 'Quiz',
  assignment: 'Assignment',
  resource: 'Resource'
};

export default function LessonViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const lessonId = params.lessonId as string;

  const { data: lessonData, isLoading: lessonLoading, error: lessonError } = useGetLessonQuery(lessonId);
  const [completeLesson, { isLoading: isCompleting }] = useCompleteLessonMutation();

  const lesson = lessonData?.data;
  const courseId = lesson?.course_id;

  const { data: lessonsData } = useGetCourseLessonsQuery(courseId!, { skip: !courseId });
  const lessons = lessonsData?.data || [];
  const currentIndex = lessons.findIndex(l => l.id === lessonId);

  const { data: completionData } = useGetCompletionStatusQuery(courseId!, { skip: !courseId });
  const completedIds = new Set(completionData?.data?.completedLessonIds || []);

  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  if (!user) return <Spinner size="lg" />;

  if (lessonLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-48 bg-slate-800/40 animate-shimmer rounded-lg" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="p-4">
        <Alert type="error">Lesson not found or you don't have access.</Alert>
        <Link href="/dashboard/student" className="text-primary-400 text-sm mt-2 inline-block hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleComplete = async () => {
    try {
      const result = await completeLesson({ lessonId, timeSpentSec: 60 }).unwrap();
      toast.success('Lesson completed! 🎉', {
        style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
      });
      if (result.data?.progressPct === 100) {
        toast.success('Course completed! 🎓', {
          style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
        });
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to complete lesson', {
        style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
      });
    }
  };

  const IconComponent = contentTypeIcons[lesson.content_type] || BookOpen;

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-2">
          {prevLesson && (
            <Link
              href={`/dashboard/lessons/${prevLesson.id}`}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
          )}
          {nextLesson && (
            <Link
              href={`/dashboard/lessons/${nextLesson.id}`}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Lesson Header */}
      <Card glass>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              'h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0',
              lesson.content_type === 'video' ? 'bg-blue-500/15' :
              lesson.content_type === 'quiz' ? 'bg-amber-500/15' :
              'bg-primary-500/15'
            )}>
              <IconComponent className={cn(
                'h-7 w-7',
                lesson.content_type === 'video' ? 'text-blue-400' :
                lesson.content_type === 'quiz' ? 'text-amber-400' :
                'text-primary-400'
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium',
                  lesson.content_type === 'video' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  lesson.content_type === 'quiz' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                )}>
                  {contentTypeLabels[lesson.content_type] || lesson.content_type}
                </span>
                {lesson.duration_minutes > 0 && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lesson.duration_minutes} min
                  </span>
                )}
                {lesson.is_free_preview && (
                  <span className="badge-published text-[10px]">Free Preview</span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white mt-2">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-sm text-slate-400 mt-1">{lesson.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Content */}
      {lesson.content_type === 'article' && lesson.article_body ? (
        <Card glass>
          <CardContent className="p-6">
            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {lesson.article_body}
            </div>
          </CardContent>
        </Card>
      ) : lesson.content_type === 'video' && lesson.content_url ? (
        <Card glass>
          <CardContent className="p-0 overflow-hidden rounded-2xl">
            <video
              controls
              className="w-full aspect-video bg-black"
              src={lesson.content_url}
              poster={lesson.thumbnail_url || undefined}
            >
              Your browser does not support the video tag.
            </video>
          </CardContent>
        </Card>
      ) : lesson.content_url ? (
        <Card glass>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">This {lesson.content_type} content is available for download</p>
            <a
              href={lesson.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500/15 text-primary-400 hover:bg-primary-500/25 transition-all text-sm font-medium"
            >
              <FileCheck className="h-4 w-4" />
              Open {contentTypeLabels[lesson.content_type] || 'Content'}
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card glass>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Content for this lesson is being prepared.</p>
          </CardContent>
        </Card>
      )}

      {/* Quiz Link */}
      {lesson.content_type === 'quiz' && (
        <Card glass className="border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Target className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Quiz Available</h3>
                <p className="text-sm text-slate-400">Test your knowledge with this quiz</p>
              </div>
              <Button onClick={() => router.push(`/dashboard/quizzes/${lessonId}`)}>
                <Zap className="h-4 w-4" />
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        {completedIds.has(lessonId) ? (
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
            <CheckCircle className="h-4 w-4" />
            Completed
          </span>
        ) : (
          <Button
            onClick={handleComplete}
            isLoading={isCompleting}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Mark as Complete
          </Button>
        )}

        <span className="text-xs text-slate-500">
          Lesson {currentIndex + 1} of {lessons.length}
        </span>

        {completionData?.data && (
          <span className="text-xs text-slate-500 ml-auto">
            Course progress: {completionData.data.progressPct}%
          </span>
        )}
      </div>
    </div>
  );
}
