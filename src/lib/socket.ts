'use client';

import { io, Socket } from 'socket.io-client';
import type { Message, TypingEvent, ReadReceipt, Conversation } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

class ChatSocket {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.emit('connect_event', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.emit('connect_event', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    this.socket.on('message:new', (message: Message) => {
      this.emit('message:new', message);
    });

    this.socket.on('message:updated', (message: Message) => {
      this.emit('message:updated', message);
    });

    this.socket.on('message:deleted', (data: { messageId: string; conversationId: string }) => {
      this.emit('message:deleted', data);
    });

    this.socket.on('typing:update', (data: TypingEvent & { isTyping: boolean }) => {
      this.emit('typing:update', data);
    });

    this.socket.on('read:updated', (data: ReadReceipt) => {
      this.emit('read:updated', data);
    });

    this.socket.on('conversation:updated', (conversation: Conversation) => {
      this.emit('conversation:updated', conversation);
    });

    this.socket.on('conversation:created', (data: { conversationId: string; conversation: Conversation }) => {
      this.emit('conversation:created', data);
    });

    this.socket.on('conversation:deleted', (data: { conversationId: string }) => {
      this.emit('conversation:deleted', data);
    });

    this.socket.on('participant:added', (data: { conversationId: string; userIds: string[]; addedBy: string }) => {
      this.emit('participant:added', data);
    });

    this.socket.on('participant:removed', (data: { conversationId: string; userId: string; removedBy: string }) => {
      this.emit('participant:removed', data);
    });

    this.socket.on('participant:left', (data: { conversationId: string; userId: string }) => {
      this.emit('participant:left', data);
    });

    this.socket.on('conversation:removed', (data: { conversationId: string }) => {
      this.emit('conversation:removed', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('conversation:join', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('conversation:leave', { conversationId });
  }

  sendMessage(data: { conversationId: string; content: string; messageType?: string; replyToId?: string }) {
    this.socket?.emit('message:send', data);
  }

  editMessage(data: { messageId: string; content: string }) {
    this.socket?.emit('message:edit', data);
  }

  deleteMessage(data: { messageId: string }) {
    this.socket?.emit('message:delete', data);
  }

  startTyping(conversationId: string) {
    this.socket?.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  markAsRead(conversationId: string, messageId: string) {
    this.socket?.emit('read:mark', { conversationId, messageId });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
    } else {
      this.listeners.get(event)?.clear();
    }
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => {
      try { cb(data); } catch (e) { console.error('[Socket] Listener error:', e); }
    });
  }
}

export const chatSocket = new ChatSocket();
