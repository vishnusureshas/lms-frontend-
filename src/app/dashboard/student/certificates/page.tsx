'use client';

import { useAuth } from '@/hooks/useAuth';
import { useListCertificatesQuery } from '@/services/api';
import type { Certificate } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import {
  Award,
  Download,
  ExternalLink,
  CheckCircle,
  Clock,
  Shield,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useListCertificatesQuery();

  const certificates = data?.data || [];

  if (!user) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold gradient-text-amber">My Certificates</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {certificates.length > 0
              ? `You have earned ${certificates.length} certificate${certificates.length !== 1 ? 's' : ''}`
              : 'Complete courses to earn certificates'}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card glass>
          <CardContent className="p-6"><SkeletonList rows={4} /></CardContent>
        </Card>
      ) : error ? (
        <Alert type="error">Failed to load certificates.</Alert>
      ) : certificates.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 flex items-center justify-center mx-auto mb-4 border border-amber-500/10">
              <Award className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">No Certificates Yet</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
              Complete a course to earn your first certificate. Keep learning!
            </p>
            <Link href="/dashboard/browse">
              <Button>Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert: Certificate) => (
            <Card key={cert.id} glass hover>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Certificate Icon */}
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-7 w-7 text-amber-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {cert.course_title || 'Course Certificate'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Issued {cert.issued_at ? formatDate(cert.issued_at) : '—'}
                    </p>

                    {/* Verification badge */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-500 border border-white/[0.06] flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {cert.certificate_code}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <a
                      href={cert.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                      title="View certificate"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={cert.certificate_url}
                      download
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
