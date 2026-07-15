'use client';

import {
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  DashboardData,
  User,
  Course,
  CourseDetail,
  Category,
  Enrollment,
  CourseListParams,
  CreateCourseRequest,
  CreateQuizRequest,
  CreateQuestionRequest,
  Quiz,
  Question,
  QuizAttempt,
  StartAttemptResponse,
  SubmitAttemptResponse,
  Certificate,
  Discussion,
  DiscussionReply,
  Notification,
  NotificationsResponse,
  UploadResponse,
  PaginationMeta,
  CourseLesson,
  AdminStats,
  AuditLog,
  Payment,
  AdminEnrollment,
  BulkUserAction,
  Conversation,
  ConversationParticipant,
  Message,
  CreateConversationRequest,
  SendMessageRequest,
} from '@/types';
import type { RootState } from '@/store/store';
import { updateTokens, logout } from '@/store/slices/authSlice';

// ───── Mutex to prevent concurrent refresh token calls ─────
const mutex = new Mutex();

// ───── Base Query ─────
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Don't override Content-Type for FormData — browser sets multipart boundary automatically
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  },
});

// ───── Base Query with Refresh Token Interceptor ─────
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait for any ongoing refresh to complete before proceeding
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  // If 401, try refreshing the token
  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const refreshToken = (api.getState() as RootState).auth.refreshToken;

        if (refreshToken) {
          // Attempt to refresh the token
          const refreshResult = await baseQuery(
            {
              url: '/auth/refresh-token',
              method: 'POST',
              body: { refreshToken },
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            // Refresh succeeded — store new tokens
            const response = refreshResult.data as ApiResponse<{
              accessToken: string;
              refreshToken: string;
            }>;
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            api.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));

            // Retry the original request with the new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            // Refresh failed — log the user out
            api.dispatch(logout());
          }
        } else {
          // No refresh token available — log the user out
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      // Another refresh is in progress — wait for it and retry
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

// ───── API Service ─────
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Dashboard', 'Courses', 'Course', 'Categories', 'Enrollments', 'Conversations', 'Participants'],
  endpoints: (builder) => ({
    // ── Auth ──

    login: builder.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    register: builder.mutation<ApiResponse<AuthResponse>, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Dashboard'],
    }),

    refreshToken: builder.mutation<
      ApiResponse<{ accessToken: string; refreshToken: string }>,
      { refreshToken: string }
    >({
      query: (body) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body,
      }),
    }),

    getMe: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    forgotPassword: builder.mutation<ApiResponse<{ message: string }>, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<
      ApiResponse<{ message: string }>,
      { token: string; password: string }
    >({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: 'POST',
        body: { password },
      }),
    }),

    // ── Dashboard ──

    getDashboard: builder.query<ApiResponse<DashboardData>, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),

    // ── Courses ──

    listCourses: builder.query<
      ApiResponse<Course[]> & { meta?: PaginationMeta },
      CourseListParams | void
    >({
      query: (params) => ({
        url: '/courses',
        params: params || {},
      }),
      providesTags: ['Courses'],
    }),

    getCourseBySlug: builder.query<ApiResponse<CourseDetail>, string>({
      query: (slug) => `/courses/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: 'Course', id: slug }],
    }),

    createCourse: builder.mutation<ApiResponse<Course>, CreateCourseRequest>({
      query: (body) => ({
        url: '/courses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Courses'],
    }),

    updateCourse: builder.mutation<
      ApiResponse<Course>,
      { id: string; data: Partial<CreateCourseRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/courses/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Courses', 'Course'],
    }),

    deleteCourse: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),

    publishCourse: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/courses/${id}/publish`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Courses', 'Course'],
    }),

    approveCourse: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/courses/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Courses', 'Course'],
    }),

    // ── Categories ──

    listCategories: builder.query<ApiResponse<Category[]>, void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),

    createCategory: builder.mutation<
      ApiResponse<Category>,
      { name: string; description?: string; icon?: string }
    >({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Categories'],
    }),

    updateCategory: builder.mutation<
      ApiResponse<Category>,
      { id: string; data: Partial<{ name: string; description: string; icon: string; is_active: boolean }> }
    >({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),

    deleteCategory: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories'],
    }),

    // ── Enrollments ──

    enrollCourse: builder.mutation<ApiResponse<{ message: string }>, { courseId: string }>({
      query: (body) => ({
        url: '/enrollments',
        method: 'POST',
        body: { courseId: body.courseId },
      }),
      invalidatesTags: ['Dashboard'],
    }),

    listEnrollments: builder.query<
      ApiResponse<Enrollment[]> & { meta?: PaginationMeta },
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (params) => ({
        url: '/enrollments',
        params: params || {},
      }),
      providesTags: ['Enrollments'],
    }),

    dropCourse: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/enrollments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Dashboard'],
    }),

    completeCourse: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/enrollments/${id}/complete`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Dashboard'],
    }),

    getEnrollment: builder.query<ApiResponse<Enrollment>, string>({
      query: (id) => `/enrollments/${id}`,
    }),

    // ── Quizzes ──

    listQuizzes: builder.query<ApiResponse<Quiz[]>, { lessonId?: string } | void>({
      query: (params) => ({
        url: '/quizzes',
        params: params || {},
      }),
    }),

    getQuiz: builder.query<ApiResponse<Quiz>, string>({
      query: (id) => `/quizzes/${id}`,
    }),

    createQuiz: builder.mutation<ApiResponse<Quiz>, CreateQuizRequest>({
      query: (body) => ({
        url: '/quizzes',
        method: 'POST',
        body,
      }),
    }),

    updateQuiz: builder.mutation<ApiResponse<Quiz>, { id: string; data: Partial<CreateQuizRequest> }>({
      query: ({ id, data }) => ({
        url: `/quizzes/${id}`,
        method: 'PATCH',
        body: data,
      }),
    }),

    deleteQuiz: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/quizzes/${id}`,
        method: 'DELETE',
      }),
    }),

    getQuizQuestions: builder.query<ApiResponse<Question[]>, string>({
      query: (quizId) => `/quizzes/${quizId}/questions`,
    }),

    addQuestion: builder.mutation<ApiResponse<Question>, { quizId: string; data: CreateQuestionRequest }>({
      query: ({ quizId, data }) => ({
        url: `/quizzes/${quizId}/questions`,
        method: 'POST',
        body: data,
      }),
    }),

    updateQuestion: builder.mutation<ApiResponse<Question>, { id: string; data: Partial<CreateQuestionRequest> }>({
      query: ({ id, data }) => ({
        url: `/questions/${id}`,
        method: 'PATCH',
        body: data,
      }),
    }),

    deleteQuestion: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/questions/${id}`,
        method: 'DELETE',
      }),
    }),

    startQuizAttempt: builder.mutation<ApiResponse<StartAttemptResponse>, string>({
      query: (quizId) => ({
        url: `/quizzes/${quizId}/start`,
        method: 'POST',
      }),
    }),

    submitQuizAttempt: builder.mutation<
      ApiResponse<SubmitAttemptResponse>,
      { quizId: string; answers: Record<string, string>; timeSpentSec?: number }
    >({
      query: ({ quizId, answers, timeSpentSec }) => ({
        url: `/quizzes/${quizId}/submit`,
        method: 'POST',
        body: { answers, timeSpentSec },
      }),
    }),

    getQuizAttempts: builder.query<ApiResponse<QuizAttempt[]>, string>({
      query: (quizId) => `/quizzes/${quizId}/attempts`,
    }),

    getQuizAttemptById: builder.query<ApiResponse<QuizAttempt>, { quizId: string; attemptId: string }>({
      query: ({ quizId, attemptId }) => `/quizzes/${quizId}/attempts/${attemptId}`,
    }),

    // ── Certificates ──

    listCertificates: builder.query<ApiResponse<Certificate[]>, void>({
      query: () => '/certificates',
    }),

    getCertificate: builder.query<ApiResponse<Certificate>, string>({
      query: (id) => `/certificates/${id}`,
    }),

    issueCertificate: builder.mutation<ApiResponse<Certificate>, { courseId: string }>({
      query: (body) => ({
        url: '/certificates/issue',
        method: 'POST',
        body,
      }),
    }),

    verifyCertificate: builder.query<ApiResponse<Certificate>, string>({
      query: (code) => `/certificates/verify/${code}`,
    }),

    // ── Discussions ──

    listDiscussions: builder.query<
      ApiResponse<Discussion[]> & { meta?: PaginationMeta },
      { courseId: string; page?: number; limit?: number }
    >({
      query: ({ courseId, ...params }) => ({
        url: `/courses/${courseId}/discussions`,
        params,
      }),
    }),

    getDiscussion: builder.query<ApiResponse<Discussion>, string>({
      query: (id) => `/discussions/${id}`,
    }),

    createDiscussion: builder.mutation<
      ApiResponse<Discussion>,
      { courseId: string; title: string; content: string }
    >({
      query: ({ courseId, ...body }) => ({
        url: `/courses/${courseId}/discussions`,
        method: 'POST',
        body,
      }),
    }),

    updateDiscussion: builder.mutation<
      ApiResponse<Discussion>,
      { id: string; data: { title?: string; content?: string } }
    >({
      query: ({ id, data }) => ({
        url: `/discussions/${id}`,
        method: 'PATCH',
        body: data,
      }),
    }),

    deleteDiscussion: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/discussions/${id}`,
        method: 'DELETE',
      }),
    }),

    togglePinDiscussion: builder.mutation<ApiResponse<Discussion>, string>({
      query: (id) => ({
        url: `/discussions/${id}/pin`,
        method: 'PATCH',
      }),
    }),

    addReply: builder.mutation<
      ApiResponse<DiscussionReply>,
      { discussionId: string; content: string }
    >({
      query: ({ discussionId, content }) => ({
        url: `/discussions/${discussionId}/replies`,
        method: 'POST',
        body: { content },
      }),
    }),

    updateReply: builder.mutation<
      ApiResponse<DiscussionReply>,
      { id: string; content: string }
    >({
      query: ({ id, content }) => ({
        url: `/replies/${id}`,
        method: 'PATCH',
        body: { content },
      }),
    }),

    deleteReply: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/replies/${id}`,
        method: 'DELETE',
      }),
    }),

    toggleSolution: builder.mutation<ApiResponse<DiscussionReply>, string>({
      query: (id) => ({
        url: `/replies/${id}/mark-solution`,
        method: 'PATCH',
      }),
    }),

    // ── Notifications ──

    listNotifications: builder.query<
      ApiResponse<Notification[]> & { unreadCount?: number; meta?: PaginationMeta },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/notifications',
        params: params || {},
      }),
    }),

    getUnreadCount: builder.query<ApiResponse<{ unreadCount: number }>, void>({
      query: () => '/notifications/unread-count',
    }),

    markNotificationRead: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
    }),

    markAllNotificationsRead: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
    }),

    deleteNotification: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
    }),

    // ── Users (Admin) ──

    listUsers: builder.query<
      ApiResponse<User[]> & { meta?: PaginationMeta },
      { page?: number; limit?: number; role?: string; search?: string; sort?: string } | void
    >({
      query: (params) => ({
        url: '/users',
        params: params || {},
      }),
    }),

    adminListUsers: builder.query<
      ApiResponse<User[]> & { meta?: PaginationMeta },
      { page?: number; limit?: number; role?: string; search?: string; status?: string } | void
    >({
      query: (params) => ({
        url: '/admin/users',
        params: params || {},
      }),
    }),

    getUser: builder.query<ApiResponse<User>, string>({
      query: (id) => `/users/${id}`,
    }),

    updateUser: builder.mutation<
      ApiResponse<User>,
      { id: string; data: { fullName?: string; bio?: string; headline?: string; avatarUrl?: string; role?: string; isActive?: boolean } }
    >({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
    }),

    deleteUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
    }),

    createUser: builder.mutation<
      ApiResponse<User>,
      { email: string; password: string; fullName: string; role: 'student' | 'instructor' | 'admin' }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    getUserEnrollments: builder.query<
      ApiResponse<Enrollment[]> & { meta?: PaginationMeta },
      { userId: string; page?: number; limit?: number; status?: string }
    >({
      query: ({ userId, ...params }) => ({
        url: `/users/${userId}/enrollments`,
        params,
      }),
    }),

    getUserProgress: builder.query<
      ApiResponse<any[]>,
      string
    >({
      query: (userId) => `/users/${userId}/progress`,
    }),

    listInstructors: builder.query<ApiResponse<User[]>, void>({
      query: () => '/users/instructors',
    }),

    getInstructorCourses: builder.query<ApiResponse<Course[]>, string>({
      query: (instructorId) => `/users/instructors/${instructorId}/courses`,
    }),

    banUser: builder.mutation<
      ApiResponse<any>,
      { id: string; reason?: string; isPermanent?: boolean; expiresInDays?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}/ban`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    unbanUser: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/unban`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // ── Admin — Bulk Actions ──

    bulkUserActions: builder.mutation<
      ApiResponse<{ processed: number; message: string }>,
      BulkUserAction
    >({
      query: (body) => ({
        url: '/admin/users/bulk-actions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // ── Admin — Stats ──

    getAdminStats: builder.query<ApiResponse<AdminStats>, void>({
      query: () => '/admin/dashboard/stats',
      providesTags: ['Dashboard'],
    }),

    // ── Admin — Courses ──

    adminListCourses: builder.query<
      ApiResponse<Course[]> & { meta?: PaginationMeta },
      { page?: number; limit?: number; status?: string; search?: string } | void
    >({
      query: (params) => ({
        url: '/admin/courses',
        params: params || {},
      }),
      providesTags: ['Courses'],
    }),

    rejectCourse: builder.mutation<
      ApiResponse<Course>,
      { id: string; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/courses/${id}/reject`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Courses', 'Course'],
    }),

    archiveCourse: builder.mutation<ApiResponse<Course>, string>({
      query: (id) => ({
        url: `/admin/courses/${id}/archive`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Courses', 'Course'],
    }),

    // ── Admin — Enrollments ──

    adminListEnrollments: builder.query<
      ApiResponse<AdminEnrollment[]> & { meta?: PaginationMeta },
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (params) => ({
        url: '/admin/enrollments',
        params: params || {},
      }),
    }),

    // ── Admin — Payments ──

    adminListPayments: builder.query<
      ApiResponse<Payment[]> & { meta?: PaginationMeta },
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (params) => ({
        url: '/admin/payments',
        params: params || {},
      }),
    }),

    // ── Admin — Audit Logs ──

    getAuditLogs: builder.query<
      ApiResponse<AuditLog[]> & { meta?: PaginationMeta },
      { page?: number; limit?: number; action?: string } | void
    >({
      query: (params) => ({
        url: '/admin/audit-logs',
        params: params || {},
      }),
    }),

    // ── Admin — User Detail / Delete (audit-logged) ──

    adminGetUser: builder.query<ApiResponse<any>, string>({
      query: (id) => `/admin/users/${id}`,
    }),

    adminUpdateUser: builder.mutation<
      ApiResponse<any>,
      { id: string; data: Record<string, any> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    adminDeleteUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // ── Admin — Course Delete / Approve (audit-logged) ──

    adminDeleteCourse: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/admin/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses', 'Course'],
    }),

    adminApproveCourse: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({
        url: `/admin/courses/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Courses', 'Course'],
    }),

    // ── Courses Search ──

    searchCourses: builder.query<
      ApiResponse<Course[]> & { meta?: PaginationMeta },
      { q: string; page?: number; limit?: number; category?: string; level?: string }
    >({
      query: (params) => ({
        url: '/courses/search',
        params,
      }),
      providesTags: ['Courses'],
    }),

    updatePassword: builder.mutation<
      ApiResponse<null>,
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/update-password',
        method: 'PATCH',
        body,
      }),
    }),

    // ── Wishlist (Plan Section 7.1) ──

    addToWishlist: builder.mutation<ApiResponse<null>, { courseId: string }>({
      query: (body) => ({
        url: '/wishlist',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Courses'],
    }),

    getWishlist: builder.query<ApiResponse<any[]>, void>({
      query: () => '/wishlist',
    }),

    removeFromWishlist: builder.mutation<ApiResponse<null>, string>({
      query: (courseId) => ({
        url: `/wishlist/${courseId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),

    // ── Reviews (Plan Section 6.1) ──

    getCourseReviews: builder.query<
      ApiResponse<any[]> & { meta?: PaginationMeta },
      { courseId: string; page?: number; limit?: number }
    >({
      query: ({ courseId, ...params }) => ({
        url: `/courses/${courseId}/reviews`,
        params,
      }),
    }),

    addReview: builder.mutation<
      ApiResponse<{ message: string; average_rating: string }>,
      { courseId: string; rating: number; comment?: string }
    >({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
    }),

    deleteReview: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
    }),

    getEnrolledStudents: builder.query<
      ApiResponse<any[]> & { meta?: PaginationMeta },
      { courseId: string; page?: number; limit?: number }
    >({
      query: ({ courseId, ...params }) => ({
        url: `/courses/${courseId}/students`,
        params,
      }),
    }),

    // ── Lessons ──

    getLesson: builder.query<ApiResponse<CourseLesson>, string>({
      query: (id) => `/lessons/${id}`,
    }),

    getCourseLessons: builder.query<ApiResponse<CourseLesson[]>, string>({
      query: (courseId) => `/courses/${courseId}/lessons`,
    }),

    getCourseById: builder.query<ApiResponse<CourseDetail>, string>({
      query: (id) => `/courses/id/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Course', id }],
    }),

    createLesson: builder.mutation<
      ApiResponse<CourseLesson>,
      { courseId: string; title: string; description?: string; content_type?: string; content_url?: string; article_body?: string; duration_minutes?: number; is_free_preview?: boolean; order_index?: number }
    >({
      query: (body) => ({
        url: '/lessons',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Course'],
    }),

    updateLesson: builder.mutation<
      ApiResponse<CourseLesson>,
      { id: string; data: Partial<{ title: string; description: string; content_type: string; content_url: string; article_body: string; duration_minutes: number; is_free_preview: boolean; order_index: number }> }
    >({
      query: ({ id, data }) => ({
        url: `/lessons/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Course'],
    }),

    deleteLesson: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/lessons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Course'],
    }),

    reorderLessons: builder.mutation<
      ApiResponse<null>,
      { courseId: string; lessonIds: string[] }
    >({
      query: (body) => ({
        url: '/lessons/reorder',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Course'],
    }),

    getCompletionStatus: builder.query<
      ApiResponse<{ completedLessonIds: string[]; progressPct: number }>,
      string
    >({
      query: (courseId) => `/lessons/status/${courseId}`,
    }),

    completeLesson: builder.mutation<
      ApiResponse<{ progressPct: number; lessonCompleted: boolean }>,
      { lessonId: string; timeSpentSec?: number }
    >({
      query: ({ lessonId, timeSpentSec }) => ({
        url: `/lessons/${lessonId}/complete`,
        method: 'POST',
        body: { timeSpentSec },
      }),
      invalidatesTags: ['Dashboard'],
    }),

    // ── File Uploads ──

    uploadThumbnail: builder.mutation<
      ApiResponse<UploadResponse>,
      { courseId: string; file: File }
    >({
      query: ({ courseId, file }) => {
        const formData = new FormData();
        formData.append('thumbnail', file);
        return {
          url: `/courses/${courseId}/thumbnail`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
    }),

    uploadLessonFile: builder.mutation<
      ApiResponse<UploadResponse>,
      { lessonId: string; file: File }
    >({
      query: ({ lessonId, file }) => {
        const formData = new FormData();
        formData.append('lessonFile', file);
        return {
          url: `/lessons/${lessonId}/upload`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
    }),

    // ── Chat ──

    searchChatUsers: builder.query<
      ApiResponse<User[]>,
      { search?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: '/users/search/chat',
        params: params || {},
      }),
    }),

    listConversations: builder.query<
      ApiResponse<Conversation[]>,
      void
    >({
      query: () => '/chat/conversations',
      providesTags: ['Conversations'],
    }),

    createConversation: builder.mutation<
      ApiResponse<Conversation>,
      CreateConversationRequest
    >({
      query: (body) => ({
        url: '/chat/conversations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Conversations'],
    }),

    getConversation: builder.query<ApiResponse<Conversation>, string>({
      query: (id) => `/chat/conversations/${id}`,
      providesTags: ['Conversations'],
    }),

    updateConversation: builder.mutation<
      ApiResponse<Conversation>,
      { id: string; data: { name?: string; description?: string } }
    >({
      query: ({ id, data }) => ({
        url: `/chat/conversations/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Conversations'],
    }),

    deleteConversation: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/chat/conversations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Conversations'],
    }),

    getMessages: builder.query<
      ApiResponse<Message[]>,
      { conversationId: string; page?: number; limit?: number; before?: string }
    >({
      query: ({ conversationId, ...params }) => ({
        url: `/chat/conversations/${conversationId}/messages`,
        params,
      }),
      providesTags: ['Conversations'],
    }),

    sendMessage: builder.mutation<
      ApiResponse<Message>,
      SendMessageRequest
    >({
      query: ({ conversationId, ...body }) => ({
        url: '/chat/messages',
        method: 'POST',
        body: { conversationId, ...body },
      }),
      invalidatesTags: ['Conversations'],
    }),

    editMessage: builder.mutation<
      ApiResponse<Message>,
      { id: string; content: string }
    >({
      query: ({ id, content }) => ({
        url: `/chat/messages/${id}`,
        method: 'PATCH',
        body: { content },
      }),
      invalidatesTags: ['Conversations'],
    }),

    deleteMessage: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/chat/messages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Conversations'],
    }),

    markAsRead: builder.mutation<
      ApiResponse<{ readAt: string }>,
      { messageId: string; conversationId: string }
    >({
      query: ({ messageId, conversationId }) => ({
        url: `/chat/messages/${messageId}/read`,
        method: 'POST',
        body: { conversationId },
      }),
      invalidatesTags: ['Conversations'],
    }),

    getParticipants: builder.query<
      ApiResponse<ConversationParticipant[]>,
      string
    >({
      query: (conversationId) => `/chat/conversations/${conversationId}/participants`,
      providesTags: ['Participants'],
    }),

    addParticipants: builder.mutation<
      ApiResponse<{ added: any[] }>,
      { conversationId: string; participantIds: string[] }
    >({
      query: ({ conversationId, participantIds }) => ({
        url: `/chat/conversations/${conversationId}/participants`,
        method: 'POST',
        body: { participantIds },
      }),
      invalidatesTags: ['Conversations', 'Participants'],
    }),

    removeParticipant: builder.mutation<
      ApiResponse<null>,
      { conversationId: string; userId: string }
    >({
      query: ({ conversationId, userId }) => ({
        url: `/chat/conversations/${conversationId}/participants/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Conversations', 'Participants'],
    }),

    leaveConversation: builder.mutation<ApiResponse<null>, string>({
      query: (conversationId) => ({
        url: `/chat/conversations/${conversationId}/leave`,
        method: 'POST',
      }),
      invalidatesTags: ['Conversations'],
    }),

    uploadChatMedia: builder.mutation<
      ApiResponse<{ url: string; fileName: string; fileSize: number; mimeType: string }>,
      { file: File; type: 'image' | 'video' | 'audio' | 'file' }
    >({
      query: ({ file, type }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/chat/upload/${type}`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
    }),
  }),
});

// ── Auto-generated Hooks ──
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useGetDashboardQuery,
  useListCoursesQuery,
  useGetCourseBySlugQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useApproveCourseMutation,
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useEnrollCourseMutation,
  useListEnrollmentsQuery,
  useDropCourseMutation,
  useCompleteCourseMutation,
  useGetEnrollmentQuery,
  useListQuizzesQuery,
  useGetQuizQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useGetQuizQuestionsQuery,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useStartQuizAttemptMutation,
  useSubmitQuizAttemptMutation,
  useGetQuizAttemptsQuery,
  useGetQuizAttemptByIdQuery,
  useListCertificatesQuery,
  useGetCertificateQuery,
  useIssueCertificateMutation,
  useVerifyCertificateQuery,
  useListDiscussionsQuery,
  useGetDiscussionQuery,
  useCreateDiscussionMutation,
  useUpdateDiscussionMutation,
  useDeleteDiscussionMutation,
  useTogglePinDiscussionMutation,
  useAddReplyMutation,
  useUpdateReplyMutation,
  useDeleteReplyMutation,
  useToggleSolutionMutation,
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useUploadThumbnailMutation,
  useUploadLessonFileMutation,
  useGetLessonQuery,
  useGetCourseLessonsQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useReorderLessonsMutation,
  useGetCompletionStatusQuery,
  useCompleteLessonMutation,
  useListUsersQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useCreateUserMutation,
  useGetUserEnrollmentsQuery,
  useGetUserProgressQuery,
  useListInstructorsQuery,
  useGetInstructorCoursesQuery,
  useUpdatePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useAddToWishlistMutation,
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
  useGetCourseReviewsQuery,
  useAddReviewMutation,
  useDeleteReviewMutation,
  useGetEnrolledStudentsQuery,
  useGetCourseByIdQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useAdminListUsersQuery,
  useBulkUserActionsMutation,
  useGetAdminStatsQuery,
  useAdminListCoursesQuery,
  useRejectCourseMutation,
  useArchiveCourseMutation,
  useAdminListEnrollmentsQuery,
  useAdminListPaymentsQuery,
  useGetAuditLogsQuery,
  useAdminGetUserQuery,
  useAdminUpdateUserMutation,
  useAdminDeleteUserMutation,
  useAdminDeleteCourseMutation,
  useAdminApproveCourseMutation,
  useSearchCoursesQuery,
  useListConversationsQuery,
  useCreateConversationMutation,
  useGetConversationQuery,
  useUpdateConversationMutation,
  useDeleteConversationMutation,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkAsReadMutation,
  useGetParticipantsQuery,
  useAddParticipantsMutation,
  useRemoveParticipantMutation,
  useLeaveConversationMutation,
  useUploadChatMediaMutation,
  useSearchChatUsersQuery,
} = api;
