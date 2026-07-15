'use client';

import { cn } from '@/lib/utils';
import { X, Crown, UserMinus, UserPlus, Search, LogOut, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGetParticipantsQuery, useRemoveParticipantMutation, useAddParticipantsMutation, useSearchChatUsersQuery, useLeaveConversationMutation, useCreateConversationMutation } from '@/services/api';
import type { ConversationParticipant } from '@/types';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentUserId?: string;
  onLeave?: () => void;
}

export default function GroupMembersModal({ isOpen, onClose, conversationId, currentUserId, onLeave }: GroupMembersModalProps) {
  const router = useRouter();
  const { data: participantsData, isLoading } = useGetParticipantsQuery(conversationId, { skip: !isOpen });
  const [removeParticipant] = useRemoveParticipantMutation();
  const [addParticipants] = useAddParticipantsMutation();
  const [leaveConversation] = useLeaveConversationMutation();
  const [createConversation] = useCreateConversationMutation();

  const participants: ConversationParticipant[] = participantsData?.data || [];
  const currentUser = participants.find((p) => p.user_id === currentUserId);
  const isAdmin = currentUser?.role === 'admin';

  // ── Remove member ──
  const handleRemove = async (userId: string, fullName: string) => {
    if (!confirm(`Remove ${fullName} from the group?`)) return;
    try {
      await removeParticipant({ conversationId, userId }).unwrap();
    } catch (err: any) {
      console.error('Failed to remove member:', err?.data?.message || err);
    }
  };

  // ── Add member ──
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const { data: searchData, isFetching: searchLoading } = useSearchChatUsersQuery(
    debouncedSearch ? { search: debouncedSearch, limit: 10 } : undefined,
    { skip: !debouncedSearch || !isOpen },
  );

  const searchResults = searchData?.data || [];

  const existingIds = new Set(participants.map((p) => p.user_id));

  const handleAdd = useCallback(async (userId: string) => {
    try {
      await addParticipants({ conversationId, participantIds: [userId] }).unwrap();
      setSearchQuery('');
      setDebouncedSearch('');
    } catch (err: any) {
      console.error('Failed to add member:', err?.data?.message || err);
    }
  }, [addParticipants, conversationId]);

  // ── Chat privately ──
  const handleChatPrivately = useCallback(async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await createConversation({ type: 'direct', participantIds: [userId] }).unwrap();
      onClose();
      router.push(`/dashboard/chat/${result.data.id}`);
    } catch (err: any) {
      console.error('Failed to create conversation:', err?.data?.message || err);
    }
  }, [createConversation, onClose, router]);

  // ── Leave group ──
  const handleLeaveGroup = useCallback(async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await leaveConversation(conversationId).unwrap();
      onClose();
      onLeave?.();
    } catch (err: any) {
      console.error('Failed to leave group:', err?.data?.message || err);
    }
  }, [leaveConversation, conversationId, onClose, onLeave]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white">Group Members</h3>
            <p className="text-xs text-slate-500 mt-0.5">{participants.length} members</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {/* Add Member row (admin only) — always visible, toggles search inline */}
              {isAdmin && (
                <div className="mb-1">
                  <button
                    onClick={() => setSearchQuery(searchQuery ? '' : ' ')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                      <UserPlus className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-emerald-400">Add Member</span>
                  </button>

                  {/* Inline search area */}
                  {(searchQuery || debouncedSearch) && (
                    <div className="px-3 pb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search users to add..."
                          value={searchQuery.trim()}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                          className="w-full h-9 pl-9 pr-3 text-sm bg-slate-800/60 border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                        />
                      </div>

                      {debouncedSearch && (
                        <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5">
                          {searchLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="h-4 w-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                            </div>
                          ) : searchResults.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-3">No users found</p>
                          ) : (
                            searchResults.map((user: any) => {
                              const alreadyMember = existingIds.has(user.id);
                              return (
                                <div
                                  key={user.id}
                                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                                >
                                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-primary-400 border border-primary-500/10 flex-shrink-0">
                                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <span className="text-sm text-white truncate flex-1">{user.full_name}</span>
                                  {alreadyMember ? (
                                    <span className="text-[11px] text-slate-500">Member</span>
                                  ) : (
                                    <button
                                      onClick={() => handleAdd(user.id)}
                                      className="p-1 rounded-lg hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 transition-colors"
                                      title="Add to group"
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {participants.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-12">No members found</p>
              ) : (
                participants.map((member) => {
                  const isSelf = member.user_id === currentUserId;
                  const canRemove = isAdmin && !isSelf && member.role !== 'admin';
                  return (
                    <div
                      key={member.id || member.user_id}
                      onClick={!isSelf ? (e) => handleChatPrivately(member.user_id, e) : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group',
                        !isSelf && 'cursor-pointer hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary-400 border border-primary-500/10 flex-shrink-0">
                        {member.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-white truncate">
                            {member.full_name}
                            {isSelf && <span className="text-xs text-slate-500 ml-1">(you)</span>}
                          </p>
                          {member.role === 'admin' && (
                            <Crown className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 capitalize">
                          {isSelf ? 'Tap to open chat' : 'Click to message'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isSelf && (
                          <button
                            onClick={(e) => handleChatPrivately(member.user_id, e)}
                            className="p-1.5 rounded-lg hover:bg-primary-500/20 text-slate-500 hover:text-primary-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Message privately"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        )}
                        {canRemove && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemove(member.user_id, member.full_name); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                            title="Remove member"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Leave group */}
        <div className="border-t border-white/[0.06] p-2 flex-shrink-0">
          <button
            onClick={handleLeaveGroup}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Leave Group
          </button>
        </div>
      </motion.div>
    </div>
  );
}
