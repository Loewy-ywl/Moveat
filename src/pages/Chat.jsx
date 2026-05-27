import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHomeData } from '@/hooks/useHomeData';
import { useChatStream } from '@/hooks/useChatStream';
import { useChatMessages } from '@/hooks/useChatMessages';
import ChatMessage from '@/components/ChatMessage';

const presets = [
  '今天还能吃炸鸡吗？',
  '为什么推荐这个？',
  '晚上跑步还能吃夜宵吗？',
  '帮我推荐晚餐',
  '查看今日营养缺口'
];

const WELCOME_MESSAGE = { role: 'assistant', text: '今天运动完啦？我帮你挑挑合适的美团外卖～' };

const Chat = () => {
  const { messages, setMessages, loading: chatLoading, saveMessage } = useChatMessages();
  const { structuredJson } = useHomeData();
  const { sendMessage, isLoading } = useChatStream(structuredJson);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!chatLoading && messages.length === 0) {
      setMessages([WELCOME_MESSAGE]);
    }
  }, [chatLoading, messages.length, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    await saveMessage('user', text);
    const currentMessages = messages;
    setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', text: '' }]);
    setInput('');

    const finalText = await sendMessage(text, currentMessages, (aiText) => {
      setMessages((m) => {
        const updated = [...m];
        updated[updated.length - 1] = { role: 'assistant', text: aiText };
        return updated;
      });
    });

    if (finalText && finalText.trim()) {
      await saveMessage('assistant', finalText);
    }
  };

  const handlePresetClick = (text) => {
    setInput(text);
  };

  return (
    <div className="h-[100dvh] bg-background max-w-md mx-auto flex flex-col pb-24">
      <div className="p-4 border-b shrink-0 bg-background">
        <h1 className="text-lg font-bold">AI 健康助手</h1>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} text={m.text} isLoading={isLoading} />
        ))}
      </div>

      <div className="p-4 border-t shrink-0 space-y-3 bg-background">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => handlePresetClick(p)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-muted text-xs hover:bg-accent transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="输入你的问题..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button size="icon" onClick={send} disabled={!input.trim() || isLoading}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
