'use client';

import { cn, timeAgo } from '@/lib/utils';
import { Users } from 'lucide-react';
import type { Conversation } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  currentUserId?: string;
}

export default function ConversationList({ conversations, activeId, onSelect, currentUserId }: ConversationListProps) {
  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-300 mb-1">No conversations yet</p>
        <p className="text-xs text-slate-500">Start a new conversation to begin chatting</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.04]">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const displayName = conv.type === 'group'
          ? conv.name || 'Group Chat'
          : conv.other_user_name || 'Direct Message';
        const initial = displayName.charAt(0).toUpperCase();

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-150 text-left',
              isActive
                ? 'bg-gradient-to-r from-primary-500/15 to-purple-500/10 border-l-2 border-primary-400'
                : 'hover:bg-white/[0.03] border-l-2 border-transparent'
            )}
          >
            {/* Avatar */}
            <div className={cn(
              'h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
              conv.type === 'group'
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20'
                : 'bg-gradient-to-br from-primary-500/20 to-purple-500/20 text-primary-400 border border-primary-500/20'
            )}>
              {conv.type === 'group' ? (
                <Users className="h-5 w-5" />
              ) : (
                initial
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className={cn(
                  'text-sm font-semibold truncate',
                  isActive ? 'text-white' : 'text-slate-200'
                )}>
                  {displayName}
                </p>
                {conv.last_message_created_at && (
                  <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">
                    {timeAgo(conv.last_message_created_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 truncate max-w-[180px]">
                  {conv.last_message_content
                    ? conv.last_message_type === 'system'
                      ? conv.last_message_content
                      : conv.last_message_content
                    : 'No messages yet'}
                </p>
                {conv.unread_count > 0 && (
                  <span className="ml-2 flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
