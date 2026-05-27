import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';

const ChatMessage = ({ role, text, isLoading }) => (
  <div className={`flex gap-2 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${role === 'assistant' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-600'}`}>
      {role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
    </div>
    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${role === 'assistant' ? 'bg-emerald-50 text-emerald-900' : 'bg-gray-100 text-gray-900'}`}>
      {role === 'assistant' && text === '' && isLoading ? (
        <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle" />
      ) : role === 'assistant' ? (
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-emerald-950">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
            h1: ({ children }) => <h1 className="font-bold text-lg mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="font-bold text-base mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="font-bold text-sm mb-1">{children}</h3>,
          }}
        >
          {text}
        </ReactMarkdown>
      ) : (
        text
      )}
    </div>
  </div>
);

export default ChatMessage;
