'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetQuizQuery,
  useStartQuizAttemptMutation,
  useSubmitQuizAttemptMutation,
  useGetQuizAttemptsQuery,
} from '@/services/api';
import type { StartAttemptResponse, SubmitAttemptResponse, GradedAnswer, QuizAttempt } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Clock, Target, CheckCircle, XCircle,
  AlertTriangle, Award, BarChart3,
  RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react';

type QuizStage = 'idle' | 'in_progress' | 'submitted' | 'results';

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const quizId = params.quizId as string;

  const [stage, setStage] = useState<QuizStage>('idle');
  const [attempt, setAttempt] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const submitRef = useRef(false);
  const answersRef = useRef(answers);
  const timeSpentRef = useRef(timeSpent);

  // Keep refs in sync so timer closure always has latest values
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeSpentRef.current = timeSpent; }, [timeSpent]);

  const [startAttempt, { isLoading: isStarting }] = useStartQuizAttemptMutation();
  const [submitAttempt, { isLoading: isSubmitting }] = useSubmitQuizAttemptMutation();
  const { data: attemptsData } = useGetQuizAttemptsQuery(quizId, { skip: stage === 'in_progress' });
  const { data: quizData, isLoading: quizLoading } = useGetQuizQuery(quizId, { skip: stage !== 'idle' });

  const quizInfo = quizData?.data;
  const attempts = attemptsData?.data || [];
  const questions = attempt?.questions || [];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

  // Submit handler — uses refs to avoid stale closures
  const handleSubmit = async () => {
    if (submitRef.current) return;
    submitRef.current = true;

    try {
      const result = await submitAttempt({
        quizId,
        answers: answersRef.current,
        timeSpentSec: timeSpentRef.current,
      }).unwrap();

      setResult(result.data);
      setStage('results');

      if (result.data.passed) {
        toast.success('Quiz passed! 🎉', {
          style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
        });
      }
    } catch (err: any) {
      submitRef.current = false;
      toast.error(err?.data?.message || 'Failed to submit quiz', {
        style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
      });
    }
  };

  // Timer countdown — only when timeLeft is set
  useEffect(() => {
    if (timeLeft === null || stage !== 'in_progress') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, stage]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && stage === 'in_progress' && !submitRef.current) {
      handleSubmit();
    }
  }, [timeLeft, stage]);

  // Track time spent (only when timeLeft is NOT set, otherwise redundant)
  useEffect(() => {
    if (stage !== 'in_progress' || timeLeft !== null) return;
    const interval = setInterval(() => setTimeSpent(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [stage, timeLeft]);

  const handleStart = async () => {
    try {
      const result = await startAttempt(quizId).unwrap();
      setAttempt(result.data);
      if (result.data.quiz.time_limit_min) {
        setTimeLeft(result.data.quiz.time_limit_min * 60);
      }
      setStage('in_progress');
      setAnswers({});
      setCurrentQuestion(0);
      submitRef.current = false;
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to start quiz', {
        style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
      });
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleRetry = () => {
    setStage('idle');
    setAttempt(null);
    setAnswers({});
    setResult(null);
    setCurrentQuestion(0);
    setTimeLeft(null);
    setTimeSpent(0);
    submitRef.current = false;
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return 'No limit';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!user) return <Spinner size="lg" />;

  // ───── STAGE: IDLE — Show quiz info + start button ─────
  if (stage === 'idle') {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card glass className="text-center py-12 px-6">
          <CardContent className="space-y-6">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mx-auto">
              <Target className="h-10 w-10 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">{quizInfo?.title || 'Ready for the Quiz?'}</h1>
              {quizInfo?.instructions && (
                <p className="text-slate-400 max-w-md mx-auto text-sm">{quizInfo.instructions}</p>
              )}
            </div>

            {/* Quiz Info Cards — populated from quiz data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Questions</p>
                <p className="text-lg font-bold text-white mt-1">
                  {quizLoading ? (
                    <span className="inline-block h-5 w-8 bg-slate-700/40 animate-shimmer rounded" />
                  ) : (
                    quizInfo?.total_questions || '—'
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Time Limit</p>
                <p className="text-lg font-bold text-white mt-1">
                  {quizLoading ? (
                    <span className="inline-block h-5 w-8 bg-slate-700/40 animate-shimmer rounded" />
                  ) : (
                    quizInfo?.time_limit_min ? `${quizInfo.time_limit_min}m` : 'No limit'
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Passing Score</p>
                <p className="text-lg font-bold text-white mt-1">
                  {quizLoading ? (
                    <span className="inline-block h-5 w-8 bg-slate-700/40 animate-shimmer rounded" />
                  ) : (
                    quizInfo?.passing_score ? `${quizInfo.passing_score}%` : '—'
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Attempts</p>
                <p className="text-lg font-bold text-white mt-1">
                  {quizLoading ? (
                    <span className="inline-block h-5 w-8 bg-slate-700/40 animate-shimmer rounded" />
                  ) : (
                    `${attempts.length + 1}${quizInfo?.max_attempts ? ` / ${quizInfo.max_attempts}` : ''}`
                  )}
                </p>
              </div>
            </div>

            <Button onClick={handleStart} isLoading={isStarting} size="lg" className="px-8">
              <Target className="h-5 w-5" />
              Start Quiz
            </Button>

            {/* Past Attempts */}
            {attempts.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Previous Attempts</h3>
                <div className="space-y-2 max-w-md mx-auto">
                  {attempts.map((a: QuizAttempt) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        {a.passed ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        )}
                        <span className="text-sm text-slate-300">
                          Attempt #{a.attempt_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'text-sm font-semibold',
                          a.passed ? 'text-emerald-400' : 'text-rose-400'
                        )}>
                          {Math.round(a.score)}%
                        </span>
                        <BarChart3 className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───── STAGE: IN PROGRESS — Show questions ─────
  if (stage === 'in_progress' && questions.length > 0) {
    const q = questions[currentQuestion];
    const isLastQuestion = currentQuestion === totalQuestions - 1;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/student')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-medium text-white">Quiz in Progress</p>
              <p className="text-xs text-slate-500">{answeredCount}/{totalQuestions} answered</p>
            </div>
          </div>
          {timeLeft !== null && (
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-mono',
              timeLeft < 60 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' : 'bg-white/[0.04] text-slate-300'
            )}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card */}
        <Card glass key={q.id}>
          <CardContent className="p-6 space-y-6">
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs text-primary-400 font-medium uppercase tracking-wider">
                  Question {currentQuestion + 1} of {totalQuestions}
                </span>
                <h2 className="text-lg font-semibold text-white mt-1">{q.question_text}</h2>
              </div>
              <div className="flex-shrink-0 px-3 py-1 rounded-lg bg-white/[0.04] text-xs text-slate-400">
                {q.points} pt{q.points !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-2">
              {q.question_type === 'multiple_choice' && q.options ? (
                q.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(q.id, opt.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all duration-200',
                      answers[q.id] === opt.id
                        ? 'bg-primary-500/10 border-primary-500/30 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.10]'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium',
                        answers[q.id] === opt.id
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-white/[0.06] text-slate-400'
                      )}>
                        {opt.id.toUpperCase()}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                    </span>
                  </button>
                ))
              ) : q.question_type === 'true_false' ? (
                ['True', 'False'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all duration-200',
                      answers[q.id] === opt
                        ? 'bg-primary-500/10 border-primary-500/30 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.10]'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium',
                        answers[q.id] === opt
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-white/[0.06] text-slate-400'
                      )}>
                        {opt.charAt(0)}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </span>
                  </button>
                ))
              ) : (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-slate-500 text-sm resize-none focus:border-primary-500/30 focus:outline-none transition-all"
                  rows={4}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))}
            disabled={currentQuestion === 0}
            variant="secondary"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-xs text-slate-500">
            {answeredCount}/{totalQuestions} answered
          </span>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={answeredCount === 0}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(p => Math.min(totalQuestions - 1, p + 1))}
              disabled={currentQuestion === totalQuestions - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ───── STAGE: RESULTS — Show score and graded answers ─────
  if (stage === 'results' && result) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Score Hero */}
        <Card glass>
          <CardContent className="p-8 text-center">
            <div className={cn(
              'h-24 w-24 rounded-3xl flex items-center justify-center mx-auto mb-4',
              result.passed ? 'bg-emerald-500/15' : 'bg-rose-500/15'
            )}>
              {result.passed ? (
                <Award className="h-12 w-12 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-rose-400" />
              )}
            </div>

            <h1 className={cn(
              'text-3xl font-bold mb-2',
              result.passed ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {result.passed ? 'Passed! 🎉' : 'Not Quite'}
            </h1>
            <p className="text-slate-400 mb-6">
              {result.passed
                ? 'Great job! You passed this quiz.'
                : 'Review the correct answers below and try again.'}
            </p>

            {/* Score Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase">Score</p>
                <p className={cn('text-xl font-bold mt-1', result.passed ? 'text-emerald-400' : 'text-rose-400')}>
                  {Math.round(result.score)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase">Earned</p>
                <p className="text-xl font-bold text-white mt-1">{result.earnedPoints}/{result.totalPoints}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase">Attempt</p>
                <p className="text-xl font-bold text-white mt-1">#{result.attemptNumber}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-slate-500 uppercase">Correct</p>
                <p className="text-xl font-bold text-white mt-1">
                  {result.answers.filter((a: GradedAnswer) => a.isCorrect).length}/{result.answers.length}
                </p>
              </div>
            </div>

            {!result.passed && (
              <Button onClick={handleRetry} className="mt-6" variant="secondary">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Graded Answers */}
        <Card glass>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Question Review</h2>
            <div className="space-y-4">
              {result.answers.map((a: GradedAnswer, i: number) => (
                <div key={a.questionId} className={cn(
                  'p-4 rounded-xl border',
                  a.isCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/15'
                    : 'bg-rose-500/5 border-rose-500/15'
                )}>
                  <div className="flex items-start gap-3">
                    {a.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white">Q{i + 1}. {a.questionText}</p>
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          a.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        )}>
                          {a.earned}/{a.points} pts
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-slate-400">
                          Your answer: <span className={a.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{a.userAnswer || '(none)'}</span>
                        </p>
                        {!a.isCorrect && a.correctAnswer && (
                          <p className="text-emerald-300">
                            Correct answer: {a.correctAnswer}
                          </p>
                        )}
                        {!a.isCorrect && a.explanation && (
                          <p className="text-slate-500 mt-1 text-xs italic">{a.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───── Loading State ─────
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-slate-800/40 animate-shimmer rounded-lg" />
      <SkeletonList rows={4} />
    </div>
  );
}
