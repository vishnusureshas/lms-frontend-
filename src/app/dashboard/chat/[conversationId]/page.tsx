'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  useGetMeQuery,
  useGetConversationQuery,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkAsReadMutation,
  useLeaveConversationMutation,
} from '@/services/api';
import { chatSocket } from '@/lib/socket';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import type { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.conversationId as string;

  const { data: userData } = useGetMeQuery();
  const { data: convData, isLoading: convLoading } = useGetConversationQuery(conversationId);
  const { data: msgsData, isLoading: msgsLoading } = useGetMessagesQuery({ conversationId, limit: 50 });
  const [sendMessage] = useSendMessageMutation();
  const [editMessage] = useEditMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const [leaveConversation] = useLeaveConversationMutation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentUserId = userData?.data?.id;
  const [triggerLoadOlder] = useLazyGetMessagesQuery();

  // Load initial messages
  useEffect(() => {
    if (msgsData?.data) {
      setMessages(msgsData.data);
      setHasMore(msgsData.data.length >= 50);
    }
  }, [msgsData]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      const result = await triggerLoadOlder({ conversationId, before: oldest.created_at, limit: 50 }).unwrap();
      const older = result?.data || [];
      if (older.length === 0 || older.length < 50) setHasMore(false);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newOnes = older.filter((m: Message) => !existingIds.has(m.id));
        return [...newOnes, ...prev];
      });
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore, loadingOlder, messages, triggerLoadOlder]);

  // Socket connection
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    chatSocket.connect(token);
    chatSocket.joinConversation(conversationId);

    const unsubNewMsg = chatSocket.on('message:new', (msg: Message) => {
      if (msg.conversation_id === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender_id !== currentUserId) {
          markAsRead({ messageId: msg.id, conversationId });
        }
      }
    });

    const unsubEdit = chatSocket.on('message:updated', (msg: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });

    const unsubDelete = chatSocket.on('message:deleted', (data: { messageId: string }) => {
      setMessages((prev) => prev.map((m) =>
        m.id === data.messageId ? { ...m, is_deleted: true, content: '' } : m
      ));
    });

    const unsubTyping = chatSocket.on('typing:update', (data: { userId: string; fullName: string; conversationId: string; isTyping: boolean }) => {
      if (data.conversationId !== conversationId || data.userId === currentUserId) return;
      if (data.isTyping) {
        setTypingUsers((prev) => prev.includes(data.fullName) ? prev : [...prev, data.fullName]);
      } else {
        setTypingUsers((prev) => prev.filter((name) => name !== data.fullName));
      }
    });

    // — Conversation & participant events —
    const unsubConvDeleted = chatSocket.on('conversation:deleted', (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) router.push('/dashboard/chat');
    });

    const unsubParticipantRemoved = chatSocket.on('participant:removed', (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId === currentUserId) {
        router.push('/dashboard/chat');
      }
    });

    const unsubConvRemoved = chatSocket.on('conversation:removed', (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) router.push('/dashboard/chat');
    });

    return () => {
      chatSocket.leaveConversation(conversationId);
      unsubNewMsg();
      unsubEdit();
      unsubDelete();
      unsubTyping();
      unsubConvDeleted();
      unsubParticipantRemoved();
      unsubConvRemoved();
    };
  }, [conversationId, currentUserId, markAsRead, router]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark last message as read
  useEffect(() => {
    if (messages.length && currentUserId) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_id !== currentUserId) {
        markAsRead({ messageId: lastMsg.id, conversationId });
      }
    }
  }, [messages, currentUserId, conversationId, markAsRead]);

  const handleSend = useCallback(async (content: string, options?: { messageType?: 'text' | 'image' | 'video' | 'audio' | 'file'; mediaUrl?: string; mediaFileName?: string; mediaFileSize?: number; mediaMimeType?: string }) => {
    if (editingMsg) {
      try {
        await editMessage({ id: editingMsg.id, content }).unwrap();
        setEditingMsg(null);
      } catch (err) {
        console.error('Failed to edit:', err);
      }
      return;
    }

    try {
      const result = await sendMessage({
        conversationId,
        content,
        replyToId: replyTo?.id,
        ...options,
      }).unwrap();
      if (result?.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.data.id)) return prev;
          return [...prev, result.data];
        });
      }
      setReplyTo(null);
      chatSocket.stopTyping(conversationId);
    } catch (err) {
      console.error('Failed to send:', err);
    }
  }, [editingMsg, replyTo, conversationId, sendMessage, editMessage]);

  const handleEdit = useCallback((msg: Message) => {
    setEditingMsg(msg);
    setReplyTo(null);
  }, []);

  const handleDelete = useCallback(async (msg: Message) => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteMessage(msg.id).unwrap();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }, [deleteMessage]);

  const handleLeave = useCallback(async () => {
    if (!confirm('Leave this conversation?')) return;
    try {
      await leaveConversation(conversationId).unwrap();
      router.push('/dashboard/chat');
    } catch (err) {
      console.error('Failed to leave:', err);
    }
  }, [conversationId, leaveConversation, router]);

  const handleBack = () => router.push('/dashboard/chat');

  if (convLoading || msgsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!convData?.data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">Conversation not found</p>
      </div>
    );
  }

  const conversation = convData.data;
  const isGroup = conversation.type === 'group';

  return (
    <div className="h-full flex flex-col">
      <ChatHeader
        conversation={conversation}
        onBack={handleBack}
        onLeave={conversation.type === 'group' ? handleLeave : undefined}
        typingUsers={typingUsers}
        isTyping={typingUsers.length > 0}
        currentUserId={currentUserId}
      />

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-sm text-slate-400 font-medium">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1">Send the first message to start the conversation</p>
          </div>
        ) : (
          <>
            {hasMore && !loadingOlder && (
              <button
                onClick={loadOlderMessages}
                className="w-full text-xs text-slate-500 hover:text-slate-300 py-3 transition-colors"
              >
                Load earlier messages
              </button>
            )}
            {loadingOlder && (
              <div className="flex items-center justify-center py-3">
                <div className="h-4 w-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
                showSender={isGroup}
                onReply={(m) => {
                  setReplyTo({
                    id: m.id,
                    content: m.content,
                    senderName: m.sender_name,
                  });
                  setEditingMsg(null);
                }}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            <AnimatePresence>
              {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
            </AnimatePresence>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Edit indicator */}
      <AnimatePresence>
        {editingMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10">
              <span className="text-[11px] text-amber-400 font-medium">Editing message</span>
              <span className="text-[11px] text-amber-300/60 truncate max-w-xs">{editingMsg.content}</span>
              <button
                onClick={() => setEditingMsg(null)}
                className="ml-auto text-[11px] text-amber-400 hover:text-amber-300"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MessageInput
        onSend={handleSend}
        onTyping={() => chatSocket.startTyping(conversationId)}
        onStopTyping={() => chatSocket.stopTyping(conversationId)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
