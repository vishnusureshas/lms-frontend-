'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useListCoursesQuery,
  useGetEnrolledStudentsQuery,
} from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  Users,
  Search,
  GraduationCap,
  Mail,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function InstructorStudentsPage() {
  const { user } = useAuth();
  const { data: coursesData, isLoading: coursesLoading } = useListCoursesQuery({ limit: 100 });
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [search, setSearch] = useState('');

  const courses = coursesData?.data || [];
  const defaultCourse = courses[0]?.id || '';
  const activeCourseId = selectedCourseId || defaultCourse;

  const { data: studentsData, isLoading: studentsLoading } = useGetEnrolledStudentsQuery(
    { courseId: activeCourseId, limit: 100 },
    { skip: !activeCourseId }
  );

  if (!user) return <Spinner size="lg" />;
  if (coursesLoading) return <Spinner size="lg" />;

  const students = studentsData?.data || [];
  const totalActive = students.filter((s: any) => s.status === 'active').length;
  const totalCompleted = students.filter((s: any) => s.status === 'completed').length;

  const filteredStudents = students.filter((s: any) => {
    if (search && !s.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Students</h1>
        <p className="text-sm text-slate-400 mt-1">View and manage enrolled students</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-gradient-blue glow-blue">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Students</p>
                <p className="text-xl font-bold text-white tabular-nums">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-emerald glow-emerald">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Active</p>
                <p className="text-xl font-bold text-white tabular-nums">{totalActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-purple glow-purple">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-xl font-bold text-white tabular-nums">{totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Selector & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <select
            value={activeCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all appearance-none"
          >
            {courses.length === 0 && <option value="">No courses available</option>}
            {courses.map((course: any) => (
              <option key={course.id} value={course.id} className="bg-slate-900">
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </div>

      {/* Students List */}
      {studentsLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : filteredStudents.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {search ? 'No students match your search' : 'No students enrolled yet'}
            </h3>
            <p className="text-sm text-slate-400">
              {search
                ? 'Try adjusting your search terms'
                : 'Students will appear here once they enroll in your course'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card glass>
          <CardHeader>
            <CardTitle>Enrolled Students ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Progress</th>
                    <th className="pb-3 font-medium">Enrolled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredStudents.map((student: any) => (
                    <tr key={student.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0">
                            {student.full_name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {student.full_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Mail className="h-3.5 w-3.5" />
                          {student.email || '—'}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : student.status === 'active'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {student.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-20 sm:w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                student.progress_pct >= 100
                                  ? 'bg-emerald-500'
                                  : 'bg-gradient-to-r from-primary-500 to-purple-500'
                              }`}
                              style={{ width: `${Math.min(student.progress_pct || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-8">
                            {Math.round(student.progress_pct || 0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-sm text-slate-400">
                        {student.enrolled_at
                          ? new Date(student.enrolled_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
