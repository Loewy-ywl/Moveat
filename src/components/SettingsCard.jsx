import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, UserCircle, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SettingsCard = () => {
  // 初始化时从 DOM 读取当前深色模式状态，避免切换页面后重置
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const handleLogout = async () => {
    const guestId = localStorage.getItem('moveat_guest_id');
    if (guestId) {
      localStorage.removeItem('moveat_guest_id');
      localStorage.removeItem('moveat_guest_name');
      localStorage.removeItem('moveat_guest_activity');
      localStorage.removeItem('moveat_guest_profile');
      localStorage.removeItem('moveat_guest_diet_logs');
      localStorage.removeItem('moveat_guest_chat_messages');
      navigate('/');
      window.location.reload();
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('退出登录失败:', err);
    } finally {
      localStorage.removeItem('moveat_nickname');
      navigate('/');
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="font-bold mb-1">设置</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Moon size={16} className="text-muted-foreground" />
            <span>深色模式</span>
          </div>
          <Switch checked={isDark} onCheckedChange={setIsDark} />
        </div>
        <div className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm">
            <UserCircle size={16} className="text-muted-foreground" />
            <span>账号管理</span>
          </div>
        </div>
        <div className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm">
            <Link2 size={16} className="text-[#FFC300]" />
            <span>美团账号授权管理</span>
          </div>
          <span className="text-xs text-muted-foreground">已授权</span>
        </div>
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut size={16} className="mr-2" />
          退出登录
        </Button>
      </CardContent>
    </Card>
  );
};

export default SettingsCard;
