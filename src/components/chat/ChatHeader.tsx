'use client';

import { cn } from '@/lib/utils';
import { ArrowLeft, Users, UserMinus, MoreVertical, Info } from 'lucide-react';
import { useState } from 'react';
import type { Conversation } from '@/types';
import GroupMembersModal from './GroupMembersModal';

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  onLeave?: () => void;
  isTyping?: boolean;
  typingUsers?: string[];
  currentUserId?: string;
}

export default function ChatHeader({ conversation, onBack, onLeave, isTyping, typingUsers, currentUserId }: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const displayName = conversation.type === 'group'
    ? conversation.name || 'Group Chat'
    : conversation.other_user_name || 'Direct Message';

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/[0.06] bg-slate-950/50 backdrop-blur-xl flex-shrink-0">
        {/* Back button (mobile) */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </button>
        )}

        {/* Avatar & Info - clickable for groups */}
        <button
          onClick={() => conversation.type === 'group' && setShowMembers(true)}
          className={cn(
            'flex items-center gap-3 min-w-0 flex-1 text-left',
            conversation.type === 'group' && 'cursor-pointer'
          )}
        >
          <div className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
            conversation.type === 'group'
              ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20'
              : 'bg-gradient-to-br from-primary-500/20 to-purple-500/20 text-primary-400 border border-primary-500/20'
          )}>
            {conversation.type === 'group' ? <Users className="h-5 w-5" /> : initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
              {displayName}
              {conversation.type === 'group' && (
                <Info className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
              )}
            </h3>
            {isTyping && typingUsers?.length ? (
              <p className="text-[11px] text-primary-400 animate-pulse">
                {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people typing...`}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                {conversation.type === 'group'
                  ? `${conversation.member_count} members`
                  : 'Online'}
              </p>
            )}
          </div>
        </button>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-slate-400" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-2xl z-50 overflow-hidden">
                {conversation.type === 'group' && (
                  <button
                    onClick={() => { setShowMenu(false); setShowMembers(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10 transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    View Members
                  </button>
                )}
                {conversation.type === 'group' && onLeave && (
                  <button
                    onClick={() => { setShowMenu(false); onLeave(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <UserMinus className="h-4 w-4" />
                    Leave Group
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {conversation.type === 'group' && (
        <GroupMembersModal
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
          conversationId={conversation.id}
          currentUserId={currentUserId}
          onLeave={onLeave}
        />
      )}
    </>
  );
}
