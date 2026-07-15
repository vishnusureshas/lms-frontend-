// ───── User Types ─────
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'instructor' | 'admin';
  avatarUrl?: string;
  isVerified?: boolean;
  bio?: string;
  headline?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: 'student' | 'instructor';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ───── Dashboard Types ─────
export interface DashboardData {
  user: User;
  type: 'student' | 'instructor' | 'admin';
  // Student dashboard
  enrollments?: Enrollment[];
  completedLessons?: number;
  totalEnrolled?: number;
  recentCourses?: Course[];
  // Instructor dashboard
  totalCourses?: number;
  publishedCourses?: number;
  totalStudents?: number;
  totalEnrollments?: number;
  courses?: Course[];
  recentEnrollments?: RecentEnrollment[];
  // Admin dashboard
  stats?: {
    users: {
      total_students: number;
      total_instructors: number;
      total_admins: number;
      inactive_users: number;
    };
    courses: {
      total_courses: number;
      published: number;
      pending: number;
      draft: number;
    };
    enrollments: {
      total: number;
      active: number;
      completed: number;
    };
    pendingReviews: number;
  };
  recentUsers?: Partial<User>[];
}

// ───── Course Types ─────
export interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail_url?: string;
  level?: string;
  total_lessons?: number;
  instructor_id?: string;
  instructor_name?: string;
  price?: number;
  is_published?: boolean;
  status?: string;
  average_rating?: number;
  total_students?: number;
  created_at: string;
}

// ───── Enrollment Types ─────
export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped' | 'expired';
  progress_pct: number;
  enrolled_at: string;
  completed_at?: string;
  title?: string;
  slug?: string;
  thumbnail_url?: string;
  level?: string;
  total_lessons?: number;
  instructor_name?: string;
}

// ───── Activity Types ─────
export interface RecentEnrollment {
  created_at: string;
  student_name?: string;
  course_title?: string;
}

// ───── API Response Types ─────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ───── Error Types ─────
export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

// ───── Category Types ─────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

// ───── Extended Course Types ─────
export interface CourseDetail extends Course {
  subtitle?: string;
  description?: string;
  language?: string;
  duration_hours?: number;
  instructor_name: string;
  instructor_avatar?: string;
  instructor_headline?: string;
  instructor_bio?: string;
  category_name?: string;
  category_slug?: string;
  avg_rating: number;
  student_count: number;
  prerequisites?: string;
  what_you_learn?: string[];
  tags?: string[];
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content_type: string;
  content_url?: string;
  article_body?: string;
  video_duration?: number;
  duration_minutes: number;
  order_index: number;
  is_free_preview: boolean;
  is_published?: boolean;
  is_completed?: boolean;
  completed_at?: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

// ───── Course List Query Params ─────
export interface CourseListParams {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  search?: string;
  sort?: string;
  instructorId?: string;
}

// ───── Create / Update Course Types ─────
export interface CreateCourseRequest {
  title: string;
  categoryId?: string;
  subtitle?: string;
  description?: string;
  price?: number;
  level?: string;
  language?: string;
  whatYouLearn?: string[];
  prerequisites?: string;
  tags?: string[];
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  thumbnail_url?: string;
}

// ───── Quiz Types ─────
export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  instructions?: string;
  time_limit_min?: number;
  passing_score: number;
  max_attempts: number;
  total_questions: number;
  total_points: number;
  shuffle_questions: boolean;
  is_published: boolean;
  lesson_title?: string;
  course_id?: string;
  course_title?: string;
  questions?: Question[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  options?: { id: string; text: string }[];
  correct_answer?: string;
  explanation?: string;
  points: number;
  order_index: number;
  tags?: string[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_points: number;
  earned_points: number;
  passed: boolean;
  answers: GradedAnswer[];
  attempt_number: number;
  time_spent_sec: number;
  started_at: string;
  submitted_at: string;
}

export interface GradedAnswer {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer?: string;
  isCorrect: boolean;
  points: number;
  earned: number;
  explanation?: string;
}

export interface StartAttemptResponse {
  quiz: {
    id: string;
    title: string;
    instructions: string;
    time_limit_min: number;
    total_questions: number;
    total_points: number;
  };
  questions: Question[];
  attempt_number: number;
  started_at: string;
}

export interface SubmitAttemptResponse {
  attemptId: string;
  score: number;
  passed: boolean;
  totalPoints: number;
  earnedPoints: number;
  attemptNumber: number;
  answers: GradedAnswer[];
}

// ───── Create Quiz / Question Request Types ─────
export interface CreateQuizRequest {
  lessonId: string;
  title: string;
  instructions?: string;
  timeLimitMin?: number;
  passingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
}

export interface CreateQuestionRequest {
  questionText: string;
  questionType?: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  options?: { id: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  orderIndex: number;
  tags?: string[];
}

// ───── Certificate Types ─────
export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  certificate_url: string;
  certificate_code: string;
  issued_at: string;
  expiry_date?: string;
  student_name?: string;
  course_title?: string;
  course_slug?: string;
  instructor_name?: string;
  is_valid?: boolean;
  reason?: string;
}

// ───── Discussion Types ─────
export interface Discussion {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_resolved: boolean;
  reply_count: number;
  author_name?: string;
  author_avatar?: string;
  author_role?: string;
  course_title?: string;
  course_slug?: string;
  replies?: DiscussionReply[];
  created_at: string;
  updated_at: string;
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  is_solution: boolean;
  author_name?: string;
  author_avatar?: string;
  author_role?: string;
  created_at: string;
  updated_at: string;
}

// ───── Notification Types ─────
export interface Notification {
  id: string;
  user_id: string;
  type: 'enrollment' | 'course_update' | 'quiz_graded' | 'assignment_due'
      | 'grade_posted' | 'certificate_issued' | 'discussion_reply'
      | 'course_approved' | 'payment_received' | 'system_announcement';
  title: string;
  message?: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
  meta: PaginationMeta;
}

// ───── File Upload Types ─────
export interface UploadResponse {
  thumbnail_url?: string;
  content_url?: string;
  file_size?: number;
  mime_type?: string;
  filename?: string;
}

// ───── Admin Types ─────
export interface AdminStats {
  users: {
    total_students: number;
    total_instructors: number;
    total_admins: number;
    inactive_users: number;
    banned_users: number;
  };
  courses: {
    total_courses: number;
    published: number;
    pending: number;
    draft: number;
    archived: number;
  };
  enrollments: {
    total: number;
    active: number;
    completed: number;
    dropped: number;
  };
  certificates: {
    total_issued: number;
  };
  pendingReviews: number;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  course_id: string;
  course_title?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  created_at: string;
}

export interface AdminEnrollment {
  id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  course_id: string;
  course_title?: string;
  status: 'active' | 'completed' | 'dropped' | 'expired';
  progress_pct: number;
  enrolled_at: string;
  completed_at?: string;
}

export interface BulkUserAction {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'delete' | 'ban' | 'change_role';
  role?: string;
  banReason?: string;
}

// ───── Chat Types ─────
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatar_url?: string;
  member_count: number;
  unread_count: number;
  last_message_content?: string;
  last_message_type?: string;
  last_message_sender_id?: string;
  last_message_created_at?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  is_active: boolean;
  joined_at: string;
  last_read_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  reply_to_id?: string;
  reply_to_content?: string;
  reply_to_sender_name?: string;
  sender_name: string;
  sender_avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  fullName: string;
}

export interface ReadReceipt {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface CreateConversationRequest {
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  participantIds: string[];
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'file';
  replyToId?: string;
}

export interface CreateConversationResponse {
  id: string;
  type: string;
  name?: string;
}
