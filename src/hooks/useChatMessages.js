import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GUEST_CHAT_KEY = 'moveat_guest_chat_messages';

export const useChatMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const isGuest = !!localStorage.getItem('moveat_guest_id');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      if (isGuest) {
        const raw = localStorage.getItem(GUEST_CHAT_KEY);
        setMessages(raw ? JSON.parse(raw) : []);
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
      setMessages((data || []).map((m) => ({ role: m.role, text: m.message_content })));
    } catch (err) {
      console.error('加载聊天记录失败:', err);
    } finally {
      setLoading(false);
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
