'use client';

import { cn } from '@/lib/utils';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}

export default function MessageBubble({ message, isOwn, showSender = true, onReply, onEdit, onDelete }: MessageBubbleProps) {
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-slate-500 bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.04]">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('flex mb-1.5', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('max-w-[75%] group relative', isOwn ? 'order-1' : 'order-1')}>
        {/* Reply context */}
        {message.reply_to_content && (
          <div className={cn(
            'text-[11px] px-3 py-1.5 mb-0.5 rounded-t-xl border-l-2',
            isOwn
              ? 'bg-primary-600/30 border-primary-300/40 text-primary-200'
              : 'bg-white/[0.06] border-slate-500/40 text-slate-400'
          )}>
            <span className="font-medium">{message.reply_to_sender_name}</span>
            <span className="ml-1 opacity-70 truncate block">{message.reply_to_content}</span>
          </div>
        )}

        <div className={cn(
          'px-3.5 py-2.5 relative',
          isOwn
            ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl rounded-br-md shadow-lg shadow-primary-500/10'
            : 'bg-white/[0.06] text-slate-200 rounded-2xl rounded-bl-md border border-white/[0.06]'
        )}>
          {/* Sender name (group chats) */}
          {showSender && !isOwn && (
            <p className="text-[11px] font-semibold text-primary-400 mb-0.5">{message.sender_name}</p>
          )}

          {/* Content */}
          {message.is_deleted ? (
            <p className="text-xs italic opacity-50 flex items-center gap-1">
              <Trash2 className="h-3 w-3" />
              Message deleted
            </p>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Footer */}
          <div className={cn(
            'flex items-center gap-1.5 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            <span className={cn(
              'text-[10px]',
              isOwn ? 'text-white/50' : 'text-slate-500'
            )}>
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.is_edited && (
              <span className={cn('text-[10px] italic', isOwn ? 'text-white/40' : 'text-slate-500')}>edited</span>
            )}
            {isOwn && !message.is_deleted && (
              <CheckCheck className="h-3.5 w-3.5 text-white/40" />
            )}
          </div>
        </div>

        {/* Hover actions */}
        {!message.is_deleted && message.message_type !== 'system' && (
          <div className={cn(
            'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-800/90 rounded-lg border border-white/[0.06] shadow-xl px-1 py-0.5',
            isOwn ? '-left-20' : '-right-20'
          )}>
            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white text-[10px]"
                title="Reply"
              >
                ↩
              </button>
            )}
            {isOwn && onEdit && (
              <button
                onClick={() => onEdit(message)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white text-[10px]"
                title="Edit"
              >
                ✎
              </button>
            )}
            {isOwn && onDelete && (
              <button
                onClick={() => onDelete(message)}
                className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-[10px]"
                title="Delete"
              >
                🗑
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
