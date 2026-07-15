# LMS — Frontend + Backend Integration Plan

> **Stack:** Next.js 14 (App Router) + Redux Toolkit + Tailwind CSS + TypeScript  
> **Backend API:** Node.js + Express.js + PostgreSQL + Redis (port 5000)  
> **Last Updated:** 2026-07-15 (Chat module integration added)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend API Complete Reference](#2-backend-api-complete-reference)
3. [Frontend-Backend Endpoint Mapping](#3-frontend-backend-endpoint-mapping)
4. [Folder Structure](#4-folder-structure)
5. [API Integration Layer](#5-api-integration-layer)
6. [State Management](#6-state-management)
7. [Authentication Flow](#7-authentication-flow)
8. [Frontend Route Design](#8-frontend-route-design)
9. [Component Tree](#9-component-tree)
10. [Implementation Status](#10-implementation-status)
11. [Remaining Gaps & Action Items](#11-remaining-gaps--action-items)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser (Client)                          │
│                                                               │
│  Next.js App Router (localhost:3000)                          │
│  ├── Pages: Auth, Dashboard (Student/Instructor/Admin),      │
│  │          Courses, Lessons, Quizzes, Discussions,           │
│  │          Notifications, Settings, Admin Panel               │
│  ├── Components: Layout, Forms, Cards, Modals, Toasts         │
│  ├── Redux Store: Auth state + RTK Query cache               │
│  └── Services: 80+ RTK Query endpoints                       │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTP (fetch) with JWT Bearer
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                Backend API (localhost:5000)                    │
│                                                               │
│  Express.js — 136 endpoints across 14 modules                │
│  ├── Auth (8)          ├── Enrollments (5)                    │
│  ├── Users (8)         ├── Lessons (8)                        │
│  ├── Courses (13)      ├── Quizzes (13)                       │
│  ├── Categories (4)    ├── Certificates (4)                   │
│  ├── Discussions (10)  ├── Notifications (5)                  │
│  ├── Chat (21)         ├── Dashboard (1)                      │
│  ├── Wishlist (3)      ├── Reviews (3)                        │
│  ├── Admin (21)        └── Infrastructure: Health, Metrics,   │
│  └──                    Swagger, Rate Limiting                 │
│                                                               │
│  Database: 18 tables (PostgreSQL)                             │
│  Cache: Redis (graceful fallback when unavailable)            │
│  Auth: JWT (15min access + 7d refresh)                        │
│  Docs: Swagger UI at /api-docs                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Backend API Complete Reference

### Infrastructure Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root welcome message |
| GET | `/health` | Health check (DB + Redis status, uptime) |
| GET | `/metrics` | Prometheus-format metrics |
| GET | `/api-docs` | Swagger UI documentation |
| GET | `/api-docs.json` | Raw OpenAPI JSON spec |

### Auth Module (`/api/v1/auth`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/auth/register` | No | Global | Register new user |
| POST | `/auth/login` | No | 5/15min | Login |
| POST | `/auth/logout` | Yes | Global | Logout (blacklists token in Redis) |
| POST | `/auth/refresh-token` | No | Global | Refresh JWT access token |
| GET | `/auth/me` | Yes | Global | Get current user profile |
| POST | `/auth/forgot-password` | No | Global | Send password reset email |
| POST | `/auth/reset-password/:token` | No | Global | Reset password with token |
| PATCH | `/auth/update-password` | Yes | Global | Update password (requires current password) |

### Users Module (`/api/v1/users`)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/users/instructors` | No | Public | List all instructors |
| GET | `/users/instructors/:id/courses` | No | Public | Get instructor's courses |
| GET | `/users/` | Yes | Admin | List all users |
| GET | `/users/:id` | Yes | Any | Get user profile |
| PATCH | `/users/:id` | Yes | Any | Update user profile |
| DELETE | `/users/:id` | Yes | Admin | Delete user |
| GET | `/users/:id/enrollments` | Yes | Any | Get user's enrollments |
| GET | `/users/:id/progress` | Yes | Any | Get user's course progress |

### Courses Module (`/api/v1/courses`)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/courses/` | No | Public | List published courses (paginated, filterable) |
| GET | `/courses/search` | No | Public | Full-text search courses |
| GET | `/courses/:slug` | No | Public | Get course by slug |
| GET | `/courses/id/:id` | Yes | Any | Get course by UUID (for editing) |
| GET | `/courses/:courseId/lessons` | Optional | Public | Get course lessons (free previews to anon) |
| GET | `/courses/:id/reviews` | No | Public | Get course reviews |
| GET | `/courses/:id/students` | Yes | Any | Get enrolled students |
| POST | `/courses/` | Yes | Instructor/Admin | Create course |
| PATCH | `/courses/:id` | Yes | Instructor/Admin | Update course |
| DELETE | `/courses/:id` | Yes | Instructor/Admin | Delete course |
| PATCH | `/courses/:id/publish` | Yes | Instructor/Admin | Request publish |
| PATCH | `/courses/:id/approve` | Yes | Admin | Approve course |
| POST | `/courses/:id/thumbnail` | Yes | Instructor/Admin | Upload thumbnail |

### Categories Module (`/api/v1/categories`)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/categories/` | No | Public | List active categories |
| POST | `/categories/` | Yes | Admin | Create category |
| PATCH | `/categories/:id` | Yes | Admin | Update category |
| DELETE | `/categories/:id` | Yes | Admin | Delete category |

### Enrollments Module (`/api/v1/enrollments`)
> All routes require authentication (router-level)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/enrollments/` | Yes | Student | Enroll in a course |
| GET | `/enrollments/` | Yes | Any | List user's enrollments |
| GET | `/enrollments/:id` | Yes | Any | Get enrollment details |
| PATCH | `/enrollments/:id/complete` | Yes | Student | Mark enrollment completed |
| DELETE | `/enrollments/:id` | Yes | Student | Drop/unenroll from course |

### Lessons Module (`/api/v1/lessons`)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/lessons/status/:courseId` | Yes | Any | Get lesson completion status for a course |
| GET | `/lessons/:id` | Optional | Public | Get lesson details |
| POST | `/lessons/` | Yes | Instructor/Admin | Create lesson |
| PATCH | `/lessons/:id` | Yes | Instructor/Admin | Update lesson |
| DELETE | `/lessons/:id` | Yes | Instructor/Admin | Delete lesson |
| PATCH | `/lessons/reorder` | Yes | Instructor/Admin | Reorder lessons |
| POST | `/lessons/:id/complete` | Yes | Student | Mark lesson completed |
| POST | `/lessons/:id/upload` | Yes | Instructor/Admin | Upload lesson content file |

### Quizzes Module (`/api/v1/quizzes`)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/quizzes/` | Yes | Any | List quizzes (filterable by lessonId) |
| GET | `/quizzes/:id` | Yes | Any | Get quiz with questions |
| POST | `/quizzes/` | Yes | Instructor/Admin | Create quiz |
| PATCH | `/quizzes/:id` | Yes | Instructor/Admin | Update quiz |
| DELETE | `/quizzes/:id` | Yes | Instructor/Admin | Delete quiz |
| GET | `/quizzes/:quizId/questions` | Yes | Any | Get quiz questions |
| POST | `/quizzes/:quizId/questions` | Yes | Instructor/Admin | Add question |
| PATCH | `/quizzes/questions/:id` | Yes | Instructor/Admin | Update question |
| DELETE | `/quizzes/questions/:id` | Yes | Instructor/Admin | Delete question |
| POST | `/quizzes/:quizId/start` | Yes | Any | Start quiz attempt |
| POST | `/quizzes/:quizId/submit` | Yes | Any | Submit quiz answers |
| GET | `/quizzes/:quizId/attempts` | Yes | Any | Get user's attempts |
| GET | `/quizzes/:quizId/attempts/:attemptId` | Yes | Any | Get specific attempt result |

### Certificates Module (`/api/v1/certificates`)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/certificates/verify/:code` | No | Public | Verify certificate by code |
| GET | `/certificates/` | Yes | Any | List user's certificates |
| GET | `/certificates/:id` | Yes | Any | Get certificate details |
| POST | `/certificates/issue` | Yes | Student | Issue certificate (after course completion) |

### Discussions Module (`/api/v1`)
> Mounted at `/api/v1` (not `/api/v1/discussions`)

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/courses/:courseId/discussions` | Yes | Any | List discussions for a course |
| POST | `/courses/:courseId/discussions` | Yes | Any | Create discussion thread |
| GET | `/discussions/:id` | Yes | Any | Get discussion with replies |
| PATCH | `/discussions/:id` | Yes | Any | Update discussion |
| DELETE | `/discussions/:id` | Yes | Any | Delete discussion |
| PATCH | `/discussions/:id/pin` | Yes | Instructor/Admin | Pin/unpin discussion |
| POST | `/discussions/:id/replies` | Yes | Any | Reply to discussion |
| PATCH | `/replies/:id/mark-solution` | Yes | Any | Mark reply as solution |
| PATCH | `/replies/:id` | Yes | Any | Update reply |
| DELETE | `/replies/:id` | Yes | Any | Delete reply |

### Notifications Module (`/api/v1/notifications`)
> All routes require authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications/` | Yes | List notifications (paginated) |
| GET | `/notifications/unread-count` | Yes | Get unread count |
| PATCH | `/notifications/read-all` | Yes | Mark all as read |
| PATCH | `/notifications/:id/read` | Yes | Mark one as read |
| DELETE | `/notifications/:id` | Yes | Delete notification |

### Dashboard Module (`/api/v1/dashboard`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/` | Yes | Get role-based dashboard data |

### Wishlist Module (`/api/v1/wishlist`)
> All routes require authentication

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/wishlist/` | Yes | Student | Add course to wishlist |
| GET | `/wishlist/` | Yes | Any | Get wishlist |
| DELETE | `/wishlist/:courseId` | Yes | Student | Remove from wishlist |

### Reviews Module (`/api/v1/reviews`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reviews/` | Yes | Add or update course review (must be enrolled) |
| GET | `/reviews/` | No | List reviews (via courseId query param) |
| DELETE | `/reviews/:id` | Yes | Delete review (owner or admin) |

### Chat Module (`/api/v1/chat`)
> All routes require authentication

#### Conversations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/chat/conversations` | Yes | List user's conversations (paginated, sorted by last_message_at) |
| POST | `/chat/conversations` | Yes | Create conversation (direct or group) |
| GET | `/chat/conversations/:id` | Yes | Get conversation details + participants |
| PATCH | `/chat/conversations/:id` | Yes (admin) | Update group info (name, description, avatar) |
| DELETE | `/chat/conversations/:id` | Yes (admin) | Delete/archive group conversation |

#### Participants (Group Management)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/chat/conversations/:id/participants` | Yes | List participants in a conversation |
| POST | `/chat/conversations/:id/participants` | Yes (admin) | Add member(s) to group |
| PATCH | `/chat/conversations/:id/participants/:userId` | Yes | Update role/mute/pin settings |
| DELETE | `/chat/conversations/:id/participants/:userId` | Yes (admin) | Remove member from group |
| POST | `/chat/conversations/:id/leave` | Yes | Leave a group (cannot leave direct conversations) |

#### Messages

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/chat/conversations/:id/messages` | Yes | Fetch message history (paginated, cursor-based) |
| GET | `/chat/messages/:id` | Yes | Get single message by ID |
| POST | `/chat/messages` | Yes | Send message (REST fallback for reliability) |
| PATCH | `/chat/messages/:id` | Yes (sender) | Edit message content |
| DELETE | `/chat/messages/:id` | Yes (sender/admin) | Soft-delete message |
| POST | `/chat/messages/:id/read` | Yes | Mark message(s) as read |

#### Media Upload

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/chat/upload/image` | Yes | Upload image (returns URL, thumbnail) |
| POST | `/chat/upload/video` | Yes | Upload video (returns URL, thumbnail) |
| POST | `/chat/upload/audio` | Yes | Upload audio (returns URL, duration) |
| POST | `/chat/upload/file` | Yes | Upload generic file (returns URL) |

#### WebSocket Events (Socket.IO)

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation:join` | `{ conversationId }` | Join a conversation room |
| `conversation:leave` | `{ conversationId }` | Leave a conversation room |
| `message:send` | `{ conversationId, content?, messageType?, replyToId?, mediaUrl? }` | Send a new message |
| `message:edit` | `{ messageId, content }` | Edit an existing message |
| `message:delete` | `{ messageId }` | Soft-delete a message |
| `typing:start` | `{ conversationId }` | User started typing |
| `typing:stop` | `{ conversationId }` | User stopped typing |
| `read:mark` | `{ conversationId, messageId }` | Mark messages as read |

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `Message` | New message in a conversation |
| `message:updated` | `Message` | Message edited |
| `message:deleted` | `{ conversationId, messageId, deletedBy }` | Message deleted |
| `typing:update` | `{ conversationId, userId, isTyping }` | Typing indicator |
| `read:updated` | `{ conversationId, messageId, userId, readAt }` | Read receipt |
| `conversation:created` | `{ conversationId, conversation }` | New conversation |
| `conversation:updated` | `Conversation` | Group info changed |
| `conversation:deleted` | `{ conversationId }` | Group deleted |
| `participant:added` | `{ conversationId, participant }` | Member added |
| `participant:removed` | `{ conversationId, userId, removedBy }` | Member removed |
| `participant:left` | `{ conversationId, userId }` | Member left |

### Admin Module (`/api/v1/admin`)
> All routes require authentication + admin role + audit logging

| Method | Path | Audit Action | Description |
|--------|------|--------------|-------------|
| GET | `/admin/dashboard/stats` | — | Admin dashboard statistics |
| GET | `/admin/users` | — | List all users |
| GET | `/admin/users/:id` | — | Get user details |
| PATCH | `/admin/users/:id` | `update_user` | Update user |
| DELETE | `/admin/users/:id` | `delete_user` | Delete user |
| POST | `/admin/users/:id/ban` | `ban_user` | Ban user |
| POST | `/admin/users/:id/unban` | `unban_user` | Unban user |
| POST | `/admin/users/bulk-actions` | `bulk_user_action` | Bulk user actions |
| GET | `/admin/courses` | — | List all courses |
| GET | `/admin/courses/:id` | — | Get course details |
| DELETE | `/admin/courses/:id` | `delete_course` | Delete course |
| PATCH | `/admin/courses/:id/approve` | `approve_course` | Approve course |
| PATCH | `/admin/courses/:id/reject` | `reject_course` | Reject course |
| PATCH | `/admin/courses/:id/archive` | `archive_course` | Archive course |
| GET | `/admin/categories` | — | List categories |
| POST | `/admin/categories` | `create_category` | Create category |
| PATCH | `/admin/categories/:id` | `update_category` | Update category |
| DELETE | `/admin/categories/:id` | `delete_category` | Delete category |
| GET | `/admin/enrollments` | — | List all enrollments |
| GET | `/admin/payments` | — | List all payments |
| GET | `/admin/audit-logs` | — | Audit log history |

---

## 3. Frontend-Backend Endpoint Mapping

Status of every backend endpoint against the frontend RTK Query service (`src/services/api.ts`).

### Legend
- **[FE]** = Endpoint defined in frontend `api.ts`
- **[FE+PAGE]** = Endpoint has dedicated frontend page
- **[MISSING]** = Backend endpoint exists but NOT in frontend `api.ts`
- **[MISSING+PAGE]** = Backend endpoint exists, NOT in frontend, AND no page exists

### Auth

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| POST `/auth/register` | `useRegisterMutation` | **[FE+PAGE]** |
| POST `/auth/login` | `useLoginMutation` | **[FE+PAGE]** |
| POST `/auth/logout` | `useLogoutMutation` | **[FE+PAGE]** |
| POST `/auth/refresh-token` | `useRefreshTokenMutation` | **[FE]** (auto-interceptor) |
| GET `/auth/me` | `useGetMeQuery` | **[FE]** |
| POST `/auth/forgot-password` | `useForgotPasswordMutation` | **[FE+PAGE]** |
| POST `/auth/reset-password/:token` | `useResetPasswordMutation` | **[FE+PAGE]** |
| PATCH `/auth/update-password` | `useUpdatePasswordMutation` | **[FE]** |

### Users

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/users/instructors` | `useListInstructorsQuery` | **[FE]** |
| GET `/users/instructors/:id/courses` | `useGetInstructorCoursesQuery` | **[FE]** |
| GET `/users/` (admin) | `useListUsersQuery` | **[FE]** |
| GET `/users/:id` | `useGetUserQuery` | **[FE]** |
| PATCH `/users/:id` | `useUpdateUserMutation` | **[FE]** |
| DELETE `/users/:id` | `useDeleteUserMutation` | **[FE]** |
| GET `/users/:id/enrollments` | `useGetUserEnrollmentsQuery` | **[FE]** |
| GET `/users/:id/progress` | `useGetUserProgressQuery` | **[FE]** |

### Courses

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/courses/` | `useListCoursesQuery` | **[FE+PAGE]** |
| GET `/courses/search` | `useSearchCoursesQuery` | **[FE]** |
| GET `/courses/:slug` | `useGetCourseBySlugQuery` | **[FE+PAGE]** |
| GET `/courses/id/:id` | `useGetCourseByIdQuery` | **[FE+PAGE]** |
| GET `/courses/:courseId/lessons` | `useGetCourseLessonsQuery` | **[FE+PAGE]** |
| GET `/courses/:id/reviews` | `useGetCourseReviewsQuery` | **[FE]** |
| GET `/courses/:id/students` | `useGetEnrolledStudentsQuery` | **[FE]** |
| POST `/courses/` | `useCreateCourseMutation` | **[FE+PAGE]** |
| PATCH `/courses/:id` | `useUpdateCourseMutation` | **[FE+PAGE]** |
| DELETE `/courses/:id` | `useDeleteCourseMutation` | **[FE]** |
| PATCH `/courses/:id/publish` | `usePublishCourseMutation` | **[FE]** |
| PATCH `/courses/:id/approve` | `useApproveCourseMutation` | **[FE]** |
| POST `/courses/:id/thumbnail` | `useUploadThumbnailMutation` | **[FE]** |

### Categories

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/categories/` | `useListCategoriesQuery` | **[FE+PAGE]** |
| POST `/categories/` | `useCreateCategoryMutation` | **[FE+PAGE]** |
| PATCH `/categories/:id` | `useUpdateCategoryMutation` | **[FE+PAGE]** |
| DELETE `/categories/:id` | `useDeleteCategoryMutation` | **[FE+PAGE]** |

### Enrollments

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| POST `/enrollments/` | `useEnrollCourseMutation` | **[FE+PAGE]** |
| GET `/enrollments/` | `useListEnrollmentsQuery` | **[FE+PAGE]** |
| GET `/enrollments/:id` | `useGetEnrollmentQuery` | **[FE]** |
| PATCH `/enrollments/:id/complete` | `useCompleteCourseMutation` | **[FE]** |
| DELETE `/enrollments/:id` | `useDropCourseMutation` | **[FE]** |

### Lessons

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/lessons/status/:courseId` | `useGetCompletionStatusQuery` | **[FE+PAGE]** |
| GET `/lessons/:id` | `useGetLessonQuery` | **[FE+PAGE]** |
| POST `/lessons/` | `useCreateLessonMutation` | **[FE]** |
| PATCH `/lessons/:id` | `useUpdateLessonMutation` | **[FE]** |
| DELETE `/lessons/:id` | `useDeleteLessonMutation` | **[FE]** |
| PATCH `/lessons/reorder` | `useReorderLessonsMutation` | **[FE]** |
| POST `/lessons/:id/complete` | `useCompleteLessonMutation` | **[FE+PAGE]** |
| POST `/lessons/:id/upload` | `useUploadLessonFileMutation` | **[FE]** |

### Quizzes

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/quizzes/` | `useListQuizzesQuery` | **[FE]** |
| GET `/quizzes/:id` | `useGetQuizQuery` | **[FE+PAGE]** |
| POST `/quizzes/` | `useCreateQuizMutation` | **[FE]** |
| PATCH `/quizzes/:id` | `useUpdateQuizMutation` | **[FE]** |
| DELETE `/quizzes/:id` | `useDeleteQuizMutation` | **[FE]** |
| GET `/quizzes/:quizId/questions` | `useGetQuizQuestionsQuery` | **[FE]** |
| POST `/quizzes/:quizId/questions` | `useAddQuestionMutation` | **[FE]** |
| PATCH `/quizzes/questions/:id` | `useUpdateQuestionMutation` | **[FE]** |
| DELETE `/quizzes/questions/:id` | `useDeleteQuestionMutation` | **[FE]** |
| POST `/quizzes/:quizId/start` | `useStartQuizAttemptMutation` | **[FE+PAGE]** |
| POST `/quizzes/:quizId/submit` | `useSubmitQuizAttemptMutation` | **[FE+PAGE]** |
| GET `/quizzes/:quizId/attempts` | `useGetQuizAttemptsQuery` | **[FE]** |
| GET `/quizzes/:quizId/attempts/:attemptId` | `useGetQuizAttemptByIdQuery` | **[FE]** |

### Certificates

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/certificates/verify/:code` | `useVerifyCertificateQuery` | **[FE]** |
| GET `/certificates/` | `useListCertificatesQuery` | **[FE+PAGE]** |
| GET `/certificates/:id` | `useGetCertificateQuery` | **[FE]** |
| POST `/certificates/issue` | `useIssueCertificateMutation` | **[FE]** |

### Discussions

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/courses/:courseId/discussions` | `useListDiscussionsQuery` | **[FE+PAGE]** |
| POST `/courses/:courseId/discussions` | `useCreateDiscussionMutation` | **[FE+PAGE]** |
| GET `/discussions/:id` | `useGetDiscussionQuery` | **[FE+PAGE]** |
| PATCH `/discussions/:id` | `useUpdateDiscussionMutation` | **[FE]** |
| DELETE `/discussions/:id` | `useDeleteDiscussionMutation` | **[FE]** |
| PATCH `/discussions/:id/pin` | `useTogglePinDiscussionMutation` | **[FE]** |
| POST `/discussions/:id/replies` | `useAddReplyMutation` | **[FE+PAGE]** |
| PATCH `/replies/:id/mark-solution` | `useToggleSolutionMutation` | **[FE]** |
| PATCH `/replies/:id` | `useUpdateReplyMutation` | **[FE]** |
| DELETE `/replies/:id` | `useDeleteReplyMutation` | **[FE]** |

### Notifications

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/notifications/` | `useListNotificationsQuery` | **[FE+PAGE]** |
| GET `/notifications/unread-count` | `useGetUnreadCountQuery` | **[FE]** |
| PATCH `/notifications/read-all` | `useMarkAllNotificationsReadMutation` | **[FE]** |
| PATCH `/notifications/:id/read` | `useMarkNotificationReadMutation` | **[FE]** |
| DELETE `/notifications/:id` | `useDeleteNotificationMutation` | **[FE]** |

### Dashboard

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/dashboard/` | `useGetDashboardQuery` | **[FE+PAGE]** |

### Wishlist

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| POST `/wishlist/` | `useAddToWishlistMutation` | **[FE]** |
| GET `/wishlist/` | `useGetWishlistQuery` | **[FE]** |
| DELETE `/wishlist/:courseId` | `useRemoveFromWishlistMutation` | **[FE]** |

### Reviews

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| POST `/reviews/` | `useAddReviewMutation` | **[FE]** |
| GET `/reviews/` | `useGetCourseReviewsQuery` | **[FE]** |
| DELETE `/reviews/:id` | `useDeleteReviewMutation` | **[FE]** |

### Chat

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/users/search/chat` | `useSearchChatUsersQuery` | **[FE]** |
| GET `/chat/conversations` | `useListConversationsQuery` | **[FE+PAGE]** |
| POST `/chat/conversations` | `useCreateConversationMutation` | **[FE+PAGE]** |
| GET `/chat/conversations/:id` | `useGetConversationQuery` | **[FE+PAGE]** |
| PATCH `/chat/conversations/:id` | `useUpdateConversationMutation` | **[FE]** |
| DELETE `/chat/conversations/:id` | `useDeleteConversationMutation` | **[FE]** |
| GET `/chat/conversations/:id/participants` | `useGetParticipantsQuery` | **[FE]** |
| POST `/chat/conversations/:id/participants` | `useAddParticipantsMutation` | **[FE]** |
| PATCH `/chat/conversations/:id/participants/:userId` | — | **[MISSING]** |
| DELETE `/chat/conversations/:id/participants/:userId` | `useRemoveParticipantMutation` | **[FE]** |
| POST `/chat/conversations/:id/leave` | `useLeaveConversationMutation` | **[FE]** |
| GET `/chat/conversations/:id/messages` | `useGetMessagesQuery` | **[FE+PAGE]** |
| GET `/chat/messages/:id` | — | **[MISSING]** |
| POST `/chat/messages` | `useSendMessageMutation` | **[FE+PAGE]** |
| PATCH `/chat/messages/:id` | `useEditMessageMutation` | **[FE]** |
| DELETE `/chat/messages/:id` | `useDeleteMessageMutation` | **[FE]** |
| POST `/chat/messages/:id/read` | `useMarkAsReadMutation` | **[FE]** |
| POST `/chat/upload/image` | `useUploadChatMediaMutation` | **[FE+PAGE]** |
| POST `/chat/upload/video` | `useUploadChatMediaMutation` | **[FE+PAGE]** |
| POST `/chat/upload/audio` | `useUploadChatMediaMutation` | **[FE+PAGE]** |
| POST `/chat/upload/file` | `useUploadChatMediaMutation` | **[FE+PAGE]** |

**Socket Events:**

| Server Event | Client Listener | Frontend Handler | Status |
|-------------|-----------------|------------------|--------|
| `message:new` | `chatSocket.on('message:new')` | page.tsx | **[FE+PAGE]** |
| `message:updated` | `chatSocket.on('message:updated')` | page.tsx | **[FE+PAGE]** |
| `message:deleted` | `chatSocket.on('message:deleted')` | page.tsx | **[FE+PAGE]** |
| `typing:update` | `chatSocket.on('typing:update')` | page.tsx | **[FE+PAGE]** |
| `read:updated` | `chatSocket.on('read:updated')` | — | **[NOT USED]** |
| `conversation:created` | `chatSocket.on('conversation:created')` | — | **[NOT USED]** |
| `conversation:updated` | `chatSocket.on('conversation:updated')` | — | **[NOT USED]** |
| `conversation:deleted` | `chatSocket.on('conversation:deleted')` | page.tsx (redirect) | **[FE+PAGE]** |
| `participant:added` | `chatSocket.on('participant:added')` | — | **[NOT USED]** |
| `participant:removed` | `chatSocket.on('participant:removed')` | page.tsx (redirect if self) | **[FE+PAGE]** |
| `participant:left` | `chatSocket.on('participant:left')` | — | **[NOT USED]** |
| `conversation:removed` | `chatSocket.on('conversation:removed')` | page.tsx (redirect) | **[FE+PAGE]** |

### Admin

| Backend Endpoint | Frontend Hook | Status |
|------------------|---------------|--------|
| GET `/admin/dashboard/stats` | `useGetAdminStatsQuery` | **[FE+PAGE]** |
| GET `/admin/users` | `useAdminListUsersQuery` | **[FE+PAGE]** |
| GET `/admin/users/:id` | `useGetUserQuery` | **[FE]** |
| PATCH `/admin/users/:id` | `useUpdateUserMutation` | **[FE]** |
| DELETE `/admin/users/:id` | `useDeleteUserMutation` | **[FE]** |
| POST `/admin/users/:id/ban` | `useBanUserMutation` | **[FE+PAGE]** |
| POST `/admin/users/:id/unban` | `useUnbanUserMutation` | **[FE+PAGE]** |
| POST `/admin/users/bulk-actions` | `useBulkUserActionsMutation` | **[FE+PAGE]** |
| GET `/admin/courses` | `useAdminListCoursesQuery` | **[FE+PAGE]** |
| GET `/admin/courses/:id` | `useGetCourseByIdQuery` | **[FE]** |
| DELETE `/admin/courses/:id` | `useDeleteCourseMutation` | **[FE]** |
| PATCH `/admin/courses/:id/approve` | `useApproveCourseMutation` | **[FE+PAGE]** |
| PATCH `/admin/courses/:id/reject` | `useRejectCourseMutation` | **[FE+PAGE]** |
| PATCH `/admin/courses/:id/archive` | `useArchiveCourseMutation` | **[FE+PAGE]** |
| GET `/admin/categories` | `useListCategoriesQuery` | **[FE+PAGE]** |
| POST `/admin/categories` | `useCreateCategoryMutation` | **[FE+PAGE]** |
| PATCH `/admin/categories/:id` | `useUpdateCategoryMutation` | **[FE]** |
| DELETE `/admin/categories/:id` | `useDeleteCategoryMutation` | **[FE]** |
| GET `/admin/enrollments` | `useAdminListEnrollmentsQuery` | **[FE+PAGE]** |
| GET `/admin/payments` | `useAdminListPaymentsQuery` | **[FE+PAGE]** |
| GET `/admin/audit-logs` | `useGetAuditLogsQuery` | **[FE+PAGE]** |

---

## 4. Folder Structure

```
frontend/
├── public/                          # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Auth layout group (split-screen hero)
│   │   │   ├── forgot-password/     # Forgot password page
│   │   │   ├── login/page.tsx       # Login page
│   │   │   ├── register/page.tsx    # Register page
│   │   │   ├── reset-password/[token]/  # Reset password page
│   │   │   └── layout.tsx           # Auth layout (animated background)
│   │   ├── courses/
│   │   │   └── [slug]/page.tsx      # Course detail page
│   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx         # Admin dashboard (stats)
│   │   │   │   ├── users/page.tsx   # User management
│   │   │   │   ├── users/new/       # Create user
│   │   │   │   ├── courses/page.tsx # Course management
│   │   │   │   ├── students/page.tsx# Student management
│   │   │   │   ├── categories/page.tsx # Category management
│   │   │   │   └── reports/page.tsx # Reports/analytics
│   │   │   ├── instructor/
│   │   │   │   ├── page.tsx         # Instructor dashboard
│   │   │   │   ├── students/page.tsx# View enrolled students
│   │   │   │   └── analytics/page.tsx # Per-course analytics
│   │   │   ├── student/
│   │   │   │   ├── page.tsx         # Student dashboard
│   │   │   │   ├── learning/page.tsx# Learning path view
│   │   │   │   └── certificates/page.tsx # View certificates
│   │   │   ├── browse/page.tsx      # Browse courses (search, filter)
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx         # My courses (instructor)
│   │   │   │   ├── new/page.tsx     # Create course form
│   │   │   │   └── [id]/edit/page.tsx # Edit course form
│   │   │   ├── lessons/[lessonId]/page.tsx # Lesson viewer
│   │   │   ├── quizzes/[quizId]/page.tsx   # Quiz taker
│   │   │   ├── discussions/
│   │   │   │   ├── page.tsx         # Discussion list
│   │   │   │   └── [id]/page.tsx    # Discussion detail + replies
│   │   │   ├── notifications/page.tsx # Notification center
│   │   │   ├── settings/page.tsx    # User profile settings
│   │   │   └── layout.tsx           # Dashboard layout (sidebar + navbar)
│   │   ├── layout.tsx               # Root layout (fonts, providers)
│   │   ├── page.tsx                 # Landing / redirect
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/                    # Auth components
│   │   ├── ui/                      # Reusable UI (Button, Input, Card, etc.)
│   │   ├── layout/                  # Navbar, Sidebar, Providers
│   │   └── forms/                   # LoginForm, RegisterForm, etc.
│   ├── lib/
│   │   ├── utils.ts                 # cn, timeAgo, formatDate, etc.
│   │   └── validators.ts            # Form validation schemas
│   ├── store/
│   │   ├── store.ts                 # Redux store config
│   │   └── slices/authSlice.ts      # Auth state management
│   ├── services/api.ts              # RTK Query (80+ endpoints)
│   ├── hooks/useAuth.ts             # Auth helper hook
│   ├── types/index.ts               # TypeScript interfaces
│   └── middleware.ts                 # Next.js middleware (passthrough)
```

---

## 5. API Integration Layer

### RTK Query Service (`services/api.ts`)

- **Base URL:** `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost:5000/api/v1`
- **Auto-refresh:** On 401, mutex-locked token refresh via `POST /auth/refresh-token`, then retry
- **Tag system:** `User`, `Dashboard`, `Courses`, `Course`, `Categories`, `Enrollments`, `Conversations`, `Participants`
- **Endpoints:** 90+ across all modules (including 16 chat endpoints)

### Tag Invalidation Map

| Tag | Invalidated by mutations |
|-----|--------------------------|
| `User` | `login`, `register`, `logout`, `getMe`, `updatePassword`, `updateUser` |
| `Dashboard` | `getDashboard` (refetch on any relevant mutation) |
| `Courses` | `createCourse`, `deleteCourse`, `publishCourse`, `approveCourse` |
| `Course` | `updateCourse`, `uploadThumbnail` (specific course) |
| `Categories` | `createCategory`, `updateCategory`, `deleteCategory` |
| `Enrollments` | `enrollCourse`, `dropCourse`, `completeCourse` |
| `Conversations` | `createConversation`, `updateConversation`, `deleteConversation`, `sendMessage`, `markAsRead`, `addParticipants`, `removeParticipant`, `leaveConversation` |
| `Participants` | `addParticipants`, `removeParticipant` |

---

## 6. State Management

### Auth Slice

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

- `setCredentials` — on login/register, persists to localStorage
- `updateTokens` — on token refresh, persists to localStorage
- `updateUser` — on profile update, persists to localStorage
- `loadAuthFromStorage` — hydrate from localStorage on app mount
- `logout` — clear all state + localStorage

### Store

- Redux Toolkit + RTK Query
- Serializable check configured for RTK Query actions

---

## 7. Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Login   │────►│  Store   │────►│   Redirect   │
│  Page    │     │  Tokens  │     │  Dashboard   │
└──────────┘     └──────────┘     └──────┬───────┘
                                         │
                                  ┌──────▼──────┐
                                  │  Check Role │
                                  └──┬───┬───┬──┘
                           ┌──────────┘   │   └──────────┐
                           ▼               ▼              ▼
                     ┌──────────┐  ┌────────────┐ ┌──────────┐
                     │  Admin   │  │ Instructor │ │ Student  │
                     └──────────┘  └────────────┘ └──────────┘
```

1. `Providers.tsx` dispatches `loadAuthFromStorage()` on mount
2. Dashboard layout checks `isAuthenticated` → redirect to `/login` if not
3. Protected API calls include `Authorization: Bearer <token>`
4. 401 → auto-refresh via RTK Query interceptor → retry
5. Refresh fails → Redux logout → redirect to `/login`
6. Token blacklist on logout (Redis-backed, 15min TTL)

---

## 8. Frontend Route Design

| Path | Auth | Role | Component | API Endpoints Used |
|------|------|------|-----------|-------------------|
| `/` | No | — | Redirect | — |
| `/login` | No | — | LoginForm | `login` |
| `/register` | No | — | RegisterForm | `register` |
| `/forgot-password` | No | — | ForgotPasswordForm | `forgot-password` |
| `/reset-password/[token]` | No | — | ResetPasswordForm | `reset-password` |
| `/dashboard/admin` | Yes | admin | AdminDashboard | `getDashboard`, `listUsers`, `listCourses` |
| `/dashboard/admin/users` | Yes | admin | UsersManagement | `listUsers`, `getUser`, `updateUser`, `deleteUser` |
| `/dashboard/admin/users/new` | Yes | admin | CreateUserForm | `register` (direct) |
| `/dashboard/admin/courses` | Yes | admin | CourseManagement | `listCourses`, `approveCourse`, `deleteCourse` |
| `/dashboard/admin/students` | Yes | admin | StudentManagement | `listUsers`, `getUserEnrollments` |
| `/dashboard/admin/categories` | Yes | admin | CategoryManagement | `listCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| `/dashboard/admin/reports` | Yes | admin | Reports | `listUsers`, `listCourses`, `listEnrollments` |
| `/dashboard/instructor` | Yes | instructor | InstructorDashboard | `getDashboard`, `listCourses`, `listEnrollments` |
| `/dashboard/instructor/students` | Yes | instructor | InstructorStudents | `getEnrolledStudents` |
| `/dashboard/instructor/analytics` | Yes | instructor | InstructorAnalytics | `listCourses`, `listEnrollments` |
| `/dashboard/student` | Yes | student | StudentDashboard | `getDashboard`, `listEnrollments` |
| `/dashboard/student/learning` | Yes | student | LearningPath | `listEnrollments`, `getCompletionStatus` |
| `/dashboard/student/certificates` | Yes | student | Certificates | `listCertificates` |
| `/dashboard/browse` | Yes | student | BrowseCourses | `listCourses`, `listCategories` |
| `/dashboard/courses` | Yes | instructor | MyCourses | `listCourses` |
| `/dashboard/courses/new` | Yes | instructor | CreateCourse | `createCourse`, `listCategories` |
| `/dashboard/courses/[id]/edit` | Yes | instructor | EditCourse | `getCourseById`, `updateCourse`, `uploadThumbnail` |
| `/dashboard/lessons/[lessonId]` | Yes | any | LessonViewer | `getLesson`, `completeLesson`, `getCompletionStatus` |
| `/dashboard/quizzes/[quizId]` | Yes | any | QuizTaker | `getQuiz`, `startQuizAttempt`, `submitQuizAttempt` |
| `/dashboard/discussions` | Yes | any | DiscussionList | `listDiscussions`, `createDiscussion` |
| `/dashboard/discussions/[id]` | Yes | any | DiscussionDetail | `getDiscussion`, `addReply`, `toggleSolution` |
| `/dashboard/notifications` | Yes | any | NotificationCenter | `listNotifications`, `markAllNotificationsRead` |
| `/dashboard/settings` | Yes | any | ProfileSettings | `getMe`, `updateUser`, `updatePassword` |
| `/dashboard/chat` | Yes | any | ChatList | `listConversations`, `createConversation` |
| `/dashboard/chat/[conversationId]` | Yes | any | ConversationDetail | `getConversation`, `getMessages`, `sendMessage`, `editMessage`, `deleteMessage`, `markAsRead`, `leaveConversation` |
| `/courses/[slug]` | No | — | CourseDetail | `getCourseBySlug`, `getCourseLessons`, `enrollCourse`, `getCourseReviews` |

---

## 9. Component Tree

```
RootLayout
├── Providers (Redux + HydrateAuth)
│   ├── (auth) layout (split-screen hero + particles)
│   │   ├── LoginPage → LoginForm
│   │   ├── RegisterPage → RegisterForm
│   │   ├── ForgotPasswordPage → ForgotPasswordForm
│   │   └── ResetPasswordPage → ResetPasswordForm
│   ├── Dashboard layout (sidebar + navbar + auth guard)
│   │   ├── Navbar (user info, notification bell, dropdown, logout)
│   │   ├── Sidebar (role-based nav links)
│   │   ├── AdminDashboard → StatCard × N, RecentUsers, RecentEnrollments
│   │   ├── AdminUsers → SearchBar, FilterTabs, UserTable, Pagination, Modal
│   │   ├── AdminCourses → CourseTable, StatusBadges, Approve/Reject/Archive
│   │   ├── AdminCategories → CategoryTable, CRUD Modal
│   │   ├── AdminReports → Charts, Metrics, AuditLogs
│   │   ├── InstructorDashboard → StatCard, CourseList, RecentEnrollments
│   │   ├── InstructorStudents → StudentTable
│   │   ├── InstructorAnalytics → PerCourseCharts
│   │   ├── StudentDashboard → StatCard, EnrolledCourses (progress bars), Recommended
│   │   ├── StudentLearning → LearningPath, CompletionStatus
│   │   ├── StudentCertificates → CertificateCard grid
│   │   ├── BrowseCourses → SearchBar, Filters, CourseCard grid/list, Pagination
│   │   ├── MyCourses → StatsBar, FilterTabs, CourseList with actions
│   │   ├── CreateCourse → Full form (title, description, category, level, price)
│   │   ├── EditCourse → Pre-populated form + Thumbnail upload
│   │   ├── LessonViewer → Video/Article/PDF, ProgressTracker, CompleteButton
│   │   ├── QuizTaker → Questions, Timer, Submit, Results
│   │   ├── DiscussionList → ThreadCard, CreateThreadModal
│   │   ├── DiscussionDetail → Thread, ReplyList, ReplyForm, Pin/Solution toggles
│   │   ├── NotificationCenter → NotificationList, MarkAllRead
│   │   ├── NotificationCenter → NotificationList, MarkAllRead
│   │   ├── ProfileSettings → AvatarUpload, Form, PasswordChange
│   │   ├── ChatList (/dashboard/chat) → ConversationList, NewChatModal, SearchBar
│   │   └── ConversationDetail (/dashboard/chat/[id])
│   │       ├── ChatHeader (back, avatar, name, typing, menu, GroupMembersModal)
│   │       ├── MessageBubble (reply, edit/delete, timestamps, deleted state)
│   │       ├── MessageInput (reply bar, attach menu, textarea, send, typing emit)
│   │       ├── TypingIndicator (animated dots, user names)
│   │       └── GroupMembersModal (add/remove members, chat privately, leave)
│   └── CourseDetail (/courses/:slug)
│       ├── Hero (title, stats, instructor, CTA/Enroll)
│       ├── Description, WhatYoullLearn, Prerequisites
│       ├── Lessons list (free preview badges)
│       ├── Reviews section
│       └── Instructor bio + Tags sidebar
```

---

## 10. Implementation Status

### Backend Status

| Feature | Status | Notes |
|---------|--------|-------|
| Database Schema (18 tables) | DONE | All migrations completed |
| Auth (JWT + Redis blacklist) | DONE | Access (15m) + Refresh (7d) |
| Email Service (Nodemailer) | DONE | SMTP or console fallback |
| Redis (ioredis) | DONE | Graceful fallback when unavailable |
| Course CRUD + Search + FTS | DONE | Full-text search with GIN index |
| Category CRUD | DONE | — |
| Enrollment System | DONE | Unique constraint per student/course |
| Lesson System + Completions | DONE | Reorder, completion tracking |
| Quiz System (questions, attempts) | DONE | 4 question types, auto-grading |
| Certificate System | DONE | Unique codes, verification |
| Discussions + Replies | DONE | Pin, solution marking |
| Notifications | DONE | 10 notification types |
| Wishlist | DONE | — |
| Reviews | DONE | Must be enrolled |
| Dashboard (role-based) | DONE | Student/instructor/admin views |
| Admin Panel (21 endpoints) | DONE | Users, courses, categories, audit logs, bans |
| Audit Logging | DONE | Middleware-based, async writes |
| Rate Limiting | DONE | Global (100/15m) + Auth (5/15m) |
| File Uploads (Multer + Sharp) | DONE | Thumbnails, lesson files |
| Docker (Dockerfile + Compose) | DONE | App + Postgres + Redis + Nginx |
| Testing (Jest) | DONE | Unit + integration tests |
| Swagger API Docs | DONE | /api-docs |
| Chat Module (REST + WebSocket) | DONE | 14 REST endpoints, 8 Socket event handlers, 17 server→client events |
| Chat Database (4 tables) | DONE | conversations, conversation_participants, messages, message_reads |
| Chat Media Upload | DONE | Multer + Sharp for image/video/audio/file |

### Frontend Status

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (Login/Register/Forgot/Reset) | DONE | Split-screen premium design |
| Dashboard layout (sidebar+navbar) | DONE | Role-based navigation |
| Admin Dashboard | DONE | Stats from API |
| Admin Users Management | DONE | List, search, filter, paginate |
| Admin Reports | DONE | Platform metrics |
| Admin User Create | DONE | `/dashboard/admin/users/new` |
| Instructor Dashboard | DONE | Courses + enrollments |
| Instructor Course Management | DONE | List, publish, delete |
| Instructor Students | DONE | Enrolled students view |
| Instructor Analytics | DONE | Per-course analytics |
| Student Dashboard | DONE | Enrolled + recommended |
| Student Learning | DONE | Learning path view |
| Student Certificates | DONE | View earned certificates |
| Browse Courses | DONE | Search, filter, paginate, grid/list |
| Course Detail | DONE | Hero, lessons, enroll, reviews |
| Course Create/Edit | DONE | Full forms with all fields |
| Lesson Viewer | DONE | Video/article/PDF, progress |
| Quiz System | DONE | Start, answer, submit, results |
| Discussions | DONE | List, detail, replies, pin/solution |
| Notifications | DONE | List, mark read, unread count |
| Profile Settings | DONE | Edit profile, password |
| RTK Query API (80+ endpoints) | DONE | Auto token refresh |
| Admin Ban/Unban Users | DONE | Ban/unban buttons on users page |
| Admin Bulk User Actions | DONE | Select all + bulk activate/deactivate/ban/delete |
| Admin Course Reject/Archive | DONE | Reject and archive buttons on courses page |
| Admin Audit Logs | DONE | Tab in reports page with paginated table |
| Admin Enrollments List | DONE | Tab in reports page with status filter |
| Admin Payments List | DONE | Tab in reports page with status filter |
| Chat — Conversations List | DONE | `/dashboard/chat` page with ConversationList, search, NewChatModal |
| Chat — Conversation Detail | DONE | Messages, send/edit/delete, real-time socket updates |
| Chat — Typing Indicators | DONE | Real-time typing via Socket.IO, TypingIndicator component |
| Chat — Read Receipts | DONE | REST markAsRead + socket read:mark emit |
| Chat — Edit/Delete Messages | DONE | Inline edit, soft-delete with tombstone |
| Chat — Group Members Modal | DONE | Add/remove members, chat privately, leave group |
| Chat — Socket.IO Client | DONE | Singleton ChatSocket class, 12 server event listeners, 8 emit methods |
| Chat — Media Upload (UI) | **DONE** | Attachment menu triggers file picker, uploads via mutation, sends media message |
| Chat — Message Pagination | **DONE** | "Load earlier messages" button, cursor-based before param, prepend older messages |
| Chat — Socket event handlers | **DONE** | `conversation:deleted`, `participant:removed`, `conversation:removed` subscribed with redirect |

---

## 11. Remaining Gaps & Action Items

### Missing Frontend API Hooks

| # | Backend Endpoint | What to Add | Priority | Status |
|---|------------------|-------------|----------|--------|
| 1 | POST `/auth/forgot-password` | `useForgotPasswordMutation` in api.ts | HIGH | **DONE** |
| 2 | POST `/auth/reset-password/:token` | `useResetPasswordMutation` in api.ts | HIGH | **DONE** |

### Chat Module Gaps

| # | Gap | What to Add | Priority | Status |
|---|-----|-------------|----------|--------|
| 1 | PATCH `/chat/conversations/:id/participants/:userId` | `useUpdateParticipantMutation` in api.ts | LOW | **BACKEND MISSING** (not in actual routes) |
| 2 | GET `/chat/messages/:id` | `useGetMessageQuery` in api.ts | LOW | **BACKEND MISSING** (not in actual routes) |
| 3 | `getConversation` / `getMessages` no cache tags | Add `providesTags` to both queries | MEDIUM | **DONE** |
| 4 | `editMessage` / `deleteMessage` no invalidation | Add `invalidatesTags: ['Conversations']` | MEDIUM | **DONE** |
| 5 | Media upload UI not wired | Wire attachment buttons to `uploadChatMedia` mutation | MEDIUM | **DONE** |
| 6 | No message pagination | Implement load-more for older messages | LOW | **DONE** |
| 7 | Socket `conversation:deleted`, `participant:removed`, `conversation:removed` not used | Subscribe to redirect on removal/deletion | LOW | **DONE** |

### Missing Admin Page Features
| 2 | POST `/auth/reset-password/:token` | `useResetPasswordMutation` in api.ts | HIGH | **DONE** |
| 3 | GET `/admin/dashboard/stats` | `useGetAdminStatsQuery` in api.ts | MEDIUM | **DONE** |
| 4 | POST `/admin/users/:id/ban` | `useBanUserMutation` in api.ts | MEDIUM | **DONE** |
| 5 | POST `/admin/users/:id/unban` | `useUnbanUserMutation` in api.ts | MEDIUM | **DONE** |
| 6 | POST `/admin/users/bulk-actions` | `useBulkUserActionsMutation` in api.ts | MEDIUM | **DONE** |
| 7 | GET `/admin/courses` | `useAdminListCoursesQuery` in api.ts | MEDIUM | **DONE** |
| 8 | PATCH `/admin/courses/:id/reject` | `useRejectCourseMutation` in api.ts | MEDIUM | **DONE** |
| 9 | PATCH `/admin/courses/:id/archive` | `useArchiveCourseMutation` in api.ts | MEDIUM | **DONE** |
| 10 | GET `/admin/enrollments` | `useAdminListEnrollmentsQuery` in api.ts | MEDIUM | **DONE** |
| 11 | GET `/admin/payments` | `useAdminListPaymentsQuery` in api.ts | LOW | **DONE** |
| 12 | GET `/admin/audit-logs` | `useGetAuditLogsQuery` in api.ts | MEDIUM | **DONE** |
| 13 | GET `/courses/search` | `useSearchCoursesQuery` in api.ts | LOW | **DONE** |

### Missing Admin Page Features

| # | Feature | Page | Backend Ready | Status |
|---|---------|------|---------------|--------|
| 1 | Ban/Unban user buttons | `/dashboard/admin/users` | YES (`/admin/users/:id/ban`) | **DONE** |
| 2 | Bulk select + actions | `/dashboard/admin/users` | YES (`/admin/users/bulk-actions`) | **DONE** |
| 3 | Course approve/reject/archive | `/dashboard/admin/courses` | YES (all 3 endpoints) | **DONE** |
| 4 | Audit log viewer | `/dashboard/admin/reports` | YES (`/admin/audit-logs`) | **DONE** |
| 5 | Enrollments list | `/dashboard/admin/reports` | YES (`/admin/enrollments`) | **DONE** |
| 6 | Payments list | `/dashboard/admin/reports` | YES (`/admin/payments`) | **DONE** |
| 7 | Admin dashboard stats | `/dashboard/admin` | YES (`/admin/dashboard/stats`) | **DONE** |

### Database Tables (22 total)

| # | Table | Used By |
|---|-------|---------|
| 1 | users | Auth, Users, Dashboard |
| 2 | categories | Categories |
| 3 | courses | Courses |
| 4 | enrollments | Enrollments |
| 5 | lessons | Lessons |
| 6 | lesson_completions | Lessons, Progress |
| 7 | quizzes | Quizzes |
| 8 | questions | Quizzes |
| 9 | quiz_attempts | Quizzes |
| 10 | certificates | Certificates |
| 11 | discussions | Discussions |
| 12 | discussion_replies | Discussions |
| 13 | notifications | Notifications |
| 14 | audit_logs | Admin (new) |
| 15 | platform_settings | Admin (new, unused) |
| 16 | announcements | Admin (new, unused) |
| 17 | content_reports | Admin (new, unused) |
| 18 | user_bans | Admin (new) |
| 19 | conversations | Chat |
| 20 | conversation_participants | Chat |
| 21 | messages | Chat |
| 22 | message_reads | Chat |

### Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/lms_db

# Auth
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional - graceful fallback)
REDIS_URL=redis://localhost:6379

# Email (optional - logs to console when not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@lmsplatform.com

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# File Uploads
MAX_FILE_SIZE=104857600
```
