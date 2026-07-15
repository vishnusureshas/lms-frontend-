'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchChatUsersQuery } from '@/services/api';
import type { User } from '@/types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (participantIds: string[], type: 'direct' | 'group', name?: string) => void;
  currentUserId?: string;
}

/** Backend returns `full_name` (snake_case) — map to camelCase User shape */
function mapUser(raw: any): User {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.full_name || raw.fullName || raw.email,
    role: raw.role,
    avatarUrl: raw.avatar_url || raw.avatarUrl,
  };
}

export default function NewChatModal({ isOpen, onClose, onCreateConversation, currentUserId }: NewChatModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  const { data: usersData, isFetching } = useSearchChatUsersQuery(
    { search: search || undefined, limit: 20 },
    { skip: !isOpen }
  );

  const rawUsers = usersData?.data || [];
  const users = rawUsers.map(mapUser).filter((u) => u.id !== currentUserId);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected([]);
      setGroupName('');
    }
  }, [isOpen]);

  const toggleUser = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleCreate = () => {
    if (!selected.length) return;
    const isGroup = selected.length > 1;
    onCreateConversation(
      selected,
      isGroup ? 'group' : 'direct',
      isGroup ? groupName.trim() || 'New Group' : undefined
    );
    setSelected([]);
    setGroupName('');
    setSearch('');
    onClose();
  };

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
          <h3 className="text-base font-semibold text-white">New Conversation</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Group name — visible IMMEDIATELY when modal opens (always show it) */}
        <div className="px-5 pt-4 flex-shrink-0">
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">
            Group Name {selected.length <= 1 && <span className="text-slate-600">(select 2+ people to make a group)</span>}
          </label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. React Study Group"
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-colors"
          />
        </div>

        {/* Search */}
        <div className="px-5 pt-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pt-3 flex-shrink-0">
            {selected.map((id) => {
              const user = users.find((u) => u.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500/15 text-primary-400 text-xs font-medium border border-primary-500/20"
                >
                  {user?.fullName || 'User'}
                  <button
                    onClick={() => toggleUser(id)}
                    className="hover:text-white ml-0.5"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">
              {search ? 'No users match your search' : 'No users available'}
            </p>
          ) : (
            users.map((user) => {
              const isSelected = selected.includes(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    isSelected
                      ? 'bg-primary-500/10 border border-primary-500/20'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  )}
                >
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary-400 border border-primary-500/10 flex-shrink-0">
                    {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email} · <span className="capitalize">{user.role}</span></p>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-white font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0">
          <button
            onClick={handleCreate}
            disabled={!selected.length}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
              selected.length
                ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30'
                : 'bg-white/[0.04] text-slate-500 cursor-not-allowed'
            )}
          >
            {selected.length > 1
              ? `Create Group${groupName.trim() ? ` "${groupName.trim()}"` : ''} (${selected.length} members)`
              : 'Start Conversation'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
