import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GUEST_CHAT_KEY = 'moveat_guest_chat_messages';

// 全局缓存
let globalChatCache = null;
let globalChatCacheTime = 0;
const CHAT_CACHE_TTL = 60 * 1000; // 1分钟

export const useChatMessages = () => {
  const [messages, setMessages] = useState(() => {
    // 尝试从全局缓存初始化
    if (globalChatCache && Date.now() - globalChatCacheTime < CHAT_CACHE_TTL) {
      return globalChatCache;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const isGuest = !!localStorage.getItem('moveat_guest_id');

  const loadMessages = useCallback(async () => {
    // 如果有有效缓存，先返回缓存，后台刷新
    if (globalChatCache && Date.now() - globalChatCacheTime < CHAT_CACHE_TTL) {
      setMessages(globalChatCache);
      // 后台刷新，不设置 loading
      refreshMessages();
      return;
    }
    // 无缓存，需要加载
    setLoading(true);
    await refreshMessages();
    setLoading(false);
  }, [isGuest]);

  const refreshMessages = useCallback(async () => {
    try {
      if (isGuest) {
        const raw = localStorage.getItem(GUEST_CHAT_KEY);
        const result = raw ? JSON.parse(raw) : [];
        setMessages(result);
        globalChatCache = result;
        globalChatCacheTime = Date.now();
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessages([]);
        return;
      }
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, message_content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      const result = (data || []).map((m) => ({ role: m.role, text: m.message_content }));
      setMessages(result);
      globalChatCache = result;
      globalChatCacheTime = Date.now();
    } catch (err) {
      console.error('加载聊天记录失败:', err);
    }
  }, [isGuest]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const saveMessage = useCallback(async (role, text) => {
    try {
      if (isGuest) {
        const raw = localStorage.getItem(GUEST_CHAT_KEY);
        const all = raw ? JSON.parse(raw) : [];
        all.push({ role, text });
        localStorage.setItem(GUEST_CHAT_KEY, JSON.stringify(all));
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        role,
        message_content: text,
      });
      if (error) throw error;
    } catch (err) {
      console.error('保存聊天记录失败:', err);
    }
  }, [isGuest]);

  return { messages, setMessages, loading, saveMessage, refresh: loadMessages };
};
