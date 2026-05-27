import { useState, useCallback } from 'react';
import { streamChat } from '@/lib/glm';

export const useChatStream = (structuredJson) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text, messages, onUpdate) => {
    setIsLoading(true);

    const history = messages.slice(-9).map((m) => ({
      role: m.role,
      content: m.text,
    }));
    const apiMessages = [...history, { role: 'user', content: text }];

    try {
      let fullText = '';
      for await (const chunk of streamChat(apiMessages, structuredJson)) {
        fullText += chunk;
        onUpdate(fullText);
      }
      return fullText;
    } catch (err) {
      console.error('AI回复失败:', err);
      onUpdate('抱歉，AI助手暂时无法连接，请检查网络或稍后重试。');
      return '抱歉，AI助手暂时无法连接，请检查网络或稍后重试。';
    } finally {
      setIsLoading(false);
    }
  }, [structuredJson]);

  return { sendMessage, isLoading };
};
