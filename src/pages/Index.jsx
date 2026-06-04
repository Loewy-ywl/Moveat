import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
          <Activity size={32} />
        </div>
        <h1 className="text-4xl font-bold mb-2">Moveat</h1>
        <p className="text-lg text-white/90 text-center mb-8">今天吃什么，应该由你的身体决定</p>

        <div className="w-full space-y-3 mb-8">
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">🎯</div>
            <div className="flex-1">
              <span className="text-sm font-medium">个性化推荐</span>
              <p className="text-xs text-white/70">基于身高体重年龄，算出你每日所需</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">🍱</div>
            <div className="flex-1">
              <span className="text-sm font-medium">外卖智能选</span>
              <p className="text-xs text-white/70">分析营养成分，推荐最适合的餐品</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">💬</div>
            <div className="flex-1">
              <span className="text-sm font-medium">AI 随身问</span>
              <p className="text-xs text-white/70">吃什么、吃多少，一问就知道</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000] h-12 text-base shadow-lg"
          >
            登录 / 注册 <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
