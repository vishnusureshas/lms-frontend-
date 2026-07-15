'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMeQuery, useListConversationsQuery, useCreateConversationMutation } from '@/services/api';
import ConversationList from '@/components/chat/ConversationList';
import NewChatModal from '@/components/chat/NewChatModal';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const router = useRouter();
  const { data: userData } = useGetMeQuery();
  const { data: convsData, isLoading } = useListConversationsQuery();
  const [createConversation] = useCreateConversationMutation();
  const [showNewChat, setShowNewChat] = useState(false);
  const [search, setSearch] = useState('');

  const conversations = convsData?.data || [];
  const filtered = search
    ? conversations.filter((c) => {
        const name = c.type === 'group' ? c.name : c.other_user_name;
        return name?.toLowerCase().includes(search.toLowerCase());
      })
    : conversations;

  const handleSelect = (id: string) => {
    router.push(`/dashboard/chat/${id}`);
  };

  const handleCreate = async (participantIds: string[], type: 'direct' | 'group', name?: string) => {
    try {
      const result = await createConversation({ type, participantIds, name }).unwrap();
      router.push(`/dashboard/chat/${result.data.id}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center border border-primary-500/20">
            <MessageSquare className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Messages</h1>
            <p className="text-xs text-slate-500">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewChat(true)}
          className="p-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/[0.04] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <ConversationList
            conversations={filtered}
            onSelect={handleSelect}
            currentUserId={userData?.data?.id}
          />
        )}
      </div>

      {/* New chat modal */}
      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreateConversation={handleCreate}
        currentUserId={userData?.data?.id}
      />
    </div>
  );
}
