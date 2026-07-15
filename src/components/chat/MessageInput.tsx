'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Send, Paperclip, X, Image, Film, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadChatMediaMutation } from '@/services/api';

export interface SendMessageOptions {
  content?: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'file';
  mediaUrl?: string;
  mediaThumbnailUrl?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  mediaMimeType?: string;
}

interface MessageInputProps {
  onSend: (content: string, options?: SendMessageOptions) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  replyTo?: { id: string; content: string; senderName: string } | null;
  onCancelReply?: () => void;
}

const mediaTypes = [
  { key: 'image' as const, label: 'Image', icon: Image, color: 'text-blue-400', accept: 'image/*' },
  { key: 'video' as const, label: 'Video', icon: Film, color: 'text-purple-400', accept: 'video/*' },
  { key: 'file' as const, label: 'File', icon: FileText, color: 'text-emerald-400', accept: '*' },
];

export default function MessageInput({ onSend, onTyping, onStopTyping, disabled, replyTo, onCancelReply }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [uploadChatMedia] = useUploadChatMediaMutation();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTypeRef = useRef<'image' | 'video' | 'audio' | 'file'>('image');

  const handleInput = useCallback((value: string) => {
    setText(value);
    if (value.length > 0 && onTyping) {
      onTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onStopTyping?.(), 2000);
    }
  }, [onTyping, onStopTyping]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      onStopTyping?.();
    }
    inputRef.current?.focus();
  }, [text, disabled, onSend, onStopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = (type: 'image' | 'video' | 'audio' | 'file') => {
    fileTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setShowAttach(false);

    try {
      const type = fileTypeRef.current;
      const result = await uploadChatMedia({ type, file }).unwrap();
      const media = result?.data;
      if (media) {
        onSend('', {
          messageType: type,
          mediaUrl: media.url,
          mediaFileName: media.fileName,
          mediaFileSize: media.fileSize,
          mediaMimeType: media.mimeType,
        });
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  }, [uploadChatMedia, onSend]);

  return (
    <div className="border-t border-white/[0.06] bg-slate-950/50 backdrop-blur-xl">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={mediaTypes.map((t) => t.accept).join(',')}
        onChange={handleFileChange}
      />

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border-b border-white/[0.04]">
              <div className="h-6 w-0.5 rounded-full bg-primary-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-primary-400">{replyTo.senderName}</p>
                <p className="text-[11px] text-slate-500 truncate">{replyTo.content}</p>
              </div>
              <button onClick={onCancelReply} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attach menu */}
      <AnimatePresence>
        {showAttach && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.04]"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              {mediaTypes.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleFileClick(item.key)}
                  disabled={uploading}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]',
                    item.color,
                    uploading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
              {uploading && <span className="text-[11px] text-slate-500 ml-1">Uploading...</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        <button
          onClick={() => setShowAttach(!showAttach)}
          className={cn(
            'p-2 rounded-xl transition-colors flex-shrink-0',
            showAttach
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
          )}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none bg-white/[0.04] border border-white/[0.06] rounded-xl',
              'px-4 py-2.5 text-sm text-white placeholder-slate-500',
              'focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20',
              'transition-all duration-200',
              'max-h-32 overflow-y-auto',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ minHeight: '42px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSend}
          disabled={!text.trim() || disabled || uploading}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200 flex-shrink-0',
            text.trim() && !disabled
              ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30'
              : 'bg-white/[0.04] text-slate-500 cursor-not-allowed'
          )}
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
