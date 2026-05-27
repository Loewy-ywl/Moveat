import { useNavigate } from 'react-router-dom';
import { Activity, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Welcome = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex flex-col relative">
      <button
        onClick={() => navigate('/chat')}
        className="absolute top-6 right-6 text-white/90 hover:text-white text-sm flex items-center bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors z-10"
      >
        <MessageCircle size={16} className="mr-1" /> AI助手
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
          <Activity size={32} />
        </div>
        <h1 className="text-4xl font-bold mb-2">Moveat</h1>
        <p className="text-lg text-white/90 text-center mb-8">今天吃什么，应该由你的身体决定</p>
        <div className="w-full space-y-3 mb-8">
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">🍎</div>
            <span className="text-sm">Apple Health</span>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">💬</div>
            <span className="text-sm">微信运动</span>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">⌚</div>
            <span className="text-sm">小米/华为手环接入</span>
          </div>
        </div>
        <div className="w-full space-y-3">
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000] h-12 text-base shadow-lg"
          >
            登录 / 注册 <ChevronRight size={18} className="ml-1" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/register')}
            className="w-full border-white/30 text-white hover:bg-white/10 h-12 text-base"
          >
            新用户注册
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
