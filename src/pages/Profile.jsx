import { useState, useEffect } from 'react';
import { Activity, History, Pencil, Dumbbell, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ProfileCard from '@/components/ProfileCard';
import ProfileActionCard from '@/components/ProfileActionCard';
import HealthDashboard from '@/components/HealthDashboard';
import SettingsCard from '@/components/SettingsCard';
import ActivityLogDialog from '@/components/ActivityLogDialog';
import { useWeeklyData } from '@/hooks/useWeeklyData';

const MOCK_ACTIVITY = { steps: 12000, calories_burned: 680, cardio_minutes: 45, strength_minutes: 30 };

const Profile = () => {
  const [nickname, setNickname] = useState('Moveat 用户');
  const [profile, setProfile] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const isGuest = !!localStorage.getItem('moveat_guest_id');
  const { data: weeklyData, loading: weeklyLoading } = useWeeklyData();

  useEffect(() => {
    if (isGuest) {
      setNickname(localStorage.getItem('moveat_guest_name') || '游客用户');
      setProfile(JSON.parse(localStorage.getItem('moveat_guest_profile') || 'null'));
      return;
    }
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) return;
        return supabase.from('users').select('*').eq('user_id', user.id).maybeSingle();
      })
      .then((result) => {
        if (result?.data) {
          setProfile(result.data);
          if (result.data.name) setNickname(result.data.name);
        }
      })
      .catch((err) => {
        console.error('加载用户档案失败:', err);
      });
  }, [isGuest]);

  const handleSaveNickname = async () => {
    const name = editNickname.trim() || 'Moveat 用户';
    setNickname(name);
    setIsEditingNickname(false);
    if (isGuest) {
      localStorage.setItem('moveat_guest_name', name);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('users').update({ name }).eq('user_id', user.id);
        toast.success('昵称已保存');
      }
    } catch (err) {
      console.error('保存昵称失败:', err);
      toast.error('保存失败');
    }
  };

  const handleSyncMockData = async () => {
    if (isGuest) {
      toast.info('游客模式下无法同步第三方设备数据');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('请先登录');
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase.from('activity_logs').select('id').eq('user_id', user.id).eq('date', today).maybeSingle();
      const payload = { user_id: user.id, date: today, ...MOCK_ACTIVITY };
      const op = existing ? supabase.from('activity_logs').update(payload).eq('id', existing.id) : supabase.from('activity_logs').insert(payload);
      const { error } = await op;
      if (error) {
        toast.error('同步失败，请重试');
      } else {
        toast.success('Apple Watch / 微信运动 / 智能手环同步成功');
      }
    } catch (err) {
      console.error('同步数据失败:', err);
      toast.error('同步失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 py-6 pb-24">
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <Dumbbell className="text-emerald-600" size={40} />
        </div>
        {!isEditingNickname ? (
          <h1
            className="text-xl font-bold cursor-pointer hover:text-emerald-600 transition-colors"
            onClick={() => { setEditNickname(nickname); setIsEditingNickname(true); }}
          >
            {nickname}
            {profile?.gender === '男' && <span className="text-blue-500 ml-1">♂</span>}
            {profile?.gender === '女' && <span className="text-pink-500 ml-1">♀</span>}
          </h1>
        ) : (
          <input
            type="text"
            value={editNickname}
            onChange={(e) => setEditNickname(e.target.value)}
            onBlur={handleSaveNickname}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
            className="text-xl font-bold text-center bg-transparent border-b-2 border-emerald-500 outline-none w-40 mb-1"
            autoFocus
          />
        )}
        <p className="text-sm text-muted-foreground">{isGuest ? '游客模式' : 'ID: 88293011'}</p>
        {isGuest && <span className="mt-2 px-3 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">游客模式</span>}
      </div>

      <ProfileCard profile={profile} />

      <div className="space-y-3 my-4">
        <ProfileActionCard icon={Activity} colorClass="bg-blue-100" textClass="text-blue-600" title="运动数据同步" desc={isGuest ? '游客模式暂不可用' : 'Apple Health 已连接'} onClick={handleSyncMockData} />
        <ProfileActionCard icon={Pencil} colorClass="bg-purple-100" textClass="text-purple-600" title="手动录入运动数据" desc="补充今日额外运动消耗" onClick={() => setShowDialog(true)} />
        <ProfileActionCard icon={UtensilsCrossed} colorClass="bg-emerald-100" textClass="text-emerald-600" title="饮食打卡" desc="记录你的每一餐" onClick={() => window.location.href = '#/diet-record'} />
        <ProfileActionCard icon={History} colorClass="bg-orange-100" textClass="text-orange-600" title="历史外卖推荐" desc="本周已推荐 12 单" onClick={() => {}} />
      </div>

      <HealthDashboard data={weeklyData} loading={weeklyLoading} />
      <div className="mt-4"><SettingsCard /></div>

      <ActivityLogDialog open={showDialog} onOpenChange={setShowDialog} onSuccess={() => toast.success('运动数据已更新')} />
    </div>
  );
};

export default Profile;
