import { useState, useEffect, useRef } from 'react';
import { Activity, History, Pencil, Dumbbell, UtensilsCrossed, X, ChevronLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ProfileCard from '@/components/ProfileCard';
import ProfileActionCard from '@/components/ProfileActionCard';
import HealthDashboard from '@/components/HealthDashboard';
import SettingsCard from '@/components/SettingsCard';
import ActivityLogDialog from '@/components/ActivityLogDialog';
import { useWeeklyData } from '@/hooks/useWeeklyData';
import { useHomeData, clearHomeDataCache } from '@/hooks/useHomeData';

const MOCK_ACTIVITY = { steps: 12000, calories_burned: 680, cardio_minutes: 45, strength_minutes: 30 };

const goalOptions = [
  { key: 'fat_loss', label: '减脂', desc: '控制热量，科学减重' },
  { key: 'muscle_gain', label: '增肌', desc: '增加蛋白质，力量训练' },
  { key: 'maintain', label: '保持体型', desc: '均衡饮食，维持现状' },
];

const prefOptions = ['中餐', '轻食', '健身餐', '低碳', '高蛋白', '素食', '日式', '韩式', '西式', '地中海饮食', '无麸质'];
const freqOptions = ['1-2次', '3-4次', '5次以上'];

// 档案数据缓存 key
const PROFILE_CACHE_KEY = 'moveat_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存

// 从缓存读取档案（带过期检查）
const getCachedProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > PROFILE_CACHE_TTL) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

// 写入缓存
const setCachedProfile = (data) => {
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
};

// 清除缓存
const clearCachedProfile = () => {
  localStorage.removeItem(PROFILE_CACHE_KEY);
};

const Profile = () => {
  const { nickname: homeNickname, refresh: refreshHomeData } = useHomeData();
  // 初始化时先从缓存读取，避免闪烁
  const cached = typeof window !== 'undefined' ? getCachedProfile() : null;
  const [profile, setProfile] = useState(cached);
  const [nickname, setNickname] = useState(homeNickname || (cached?.name) || 'Moveat 用户');
  const [profileLoading, setProfileLoading] = useState(!cached);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const isGuest = !!localStorage.getItem('moveat_guest_id');
  const { data: weeklyData, loading: weeklyLoading } = useWeeklyData();

  // 加载档案数据（有缓存则先显示缓存，后台静默刷新）
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      // 如果已有缓存，不显示 loading，后台静默刷新
      if (!cancelled && !profile) {
        setProfileLoading(true);
      }

      try {
        if (isGuest) {
          const guestProfile = JSON.parse(localStorage.getItem('moveat_guest_profile') || 'null');
          if (!cancelled) {
            setProfile(guestProfile);
            setProfileLoading(false);
          }
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) setProfileLoading(false);
          return;
        }

        const { data: userData } = await supabase.from('users').select('*').eq('user_id', user.id).maybeSingle();
        if (!cancelled) {
          if (userData) {
            setProfile(userData);
            setCachedProfile(userData); // 写入缓存
          }
          setProfileLoading(false);
          if (userData?.name) setNickname(userData.name);
        }
      } catch (err) {
        console.error('加载档案数据失败:', err);
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [isGuest]);

  // 同步昵称
  useEffect(() => {
    if (homeNickname && !profile?.name) setNickname(homeNickname);
  }, [homeNickname, profile]);

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

  const openProfileEdit = () => {
    setEditForm({
      height: profile?.height || 175,
      weight: profile?.weight || 70,
      age: profile?.age || 25,
      gender: profile?.gender || '男',
      goal: profile?.goal || 'maintain',
      diet_preference: profile?.diet_preference ? profile.diet_preference.split(',').filter(Boolean) : [],
      forbidden_food: profile?.forbidden_food || '',
      sport_frequency: profile?.sport_frequency || '3-4次',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const payload = {
      height: parseInt(editForm.height) || 175,
      weight: parseInt(editForm.weight) || 70,
      age: parseInt(editForm.age) || 25,
      gender: editForm.gender,
      goal: editForm.goal,
      diet_preference: editForm.diet_preference.join(','),
      forbidden_food: editForm.forbidden_food,
      sport_frequency: editForm.sport_frequency,
    };
    try {
      if (isGuest) {
        localStorage.setItem('moveat_guest_profile', JSON.stringify({ ...payload, user_id: localStorage.getItem('moveat_guest_id') || '' }));
        setProfile({ ...payload, user_id: localStorage.getItem('moveat_guest_id') || '' });
        toast.success('档案已更新');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // 使用 upsert：有则更新，无则插入
          const { error } = await supabase.from('users').upsert({
            user_id: user.id,
            ...payload,
          }, { onConflict: 'user_id' });
          if (error) throw error;
          // 更新本地 profile 和缓存
          const updated = { ...(profile || {}), user_id: user.id, ...payload };
          setProfile(updated);
          setCachedProfile(updated);
          // 清除 useHomeData 缓存，让其他页面获取最新数据
          clearHomeDataCache();
          await refreshHomeData();
          toast.success('档案已更新');
        }
      }
      setIsEditingProfile(false);
    } catch (err) {
      console.error('保存档案失败:', err);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (t) => {
    setEditForm((prev) => ({
      ...prev,
      diet_preference: prev.diet_preference.includes(t)
        ? prev.diet_preference.filter((x) => x !== t)
        : [...prev.diet_preference, t],
    }));
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

      <ProfileCard profile={profile} onEdit={openProfileEdit} loading={profileLoading} />

      <div className="space-y-3 my-4">
        <ProfileActionCard icon={Activity} colorClass="bg-blue-100" textClass="text-blue-600" title="运动数据同步" desc={isGuest ? '游客模式暂不可用' : 'Apple Health 已连接'} onClick={handleSyncMockData} />
        <ProfileActionCard icon={Pencil} colorClass="bg-purple-100" textClass="text-purple-600" title="手动录入运动数据" desc="补充今日额外运动消耗" onClick={() => setShowDialog(true)} />
        <ProfileActionCard icon={UtensilsCrossed} colorClass="bg-emerald-100" textClass="text-emerald-600" title="饮食打卡" desc="记录你的每一餐" onClick={() => window.location.href = '#/diet-record'} />
        <ProfileActionCard icon={History} colorClass="bg-orange-100" textClass="text-orange-600" title="历史外卖推荐" desc="本周已推荐 12 单" onClick={() => {}} />
      </div>

      <HealthDashboard data={weeklyData} loading={weeklyLoading} />
      <div className="mt-4"><SettingsCard /></div>

      {/* 档案编辑弹窗 */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="max-w-md mx-auto px-5 py-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft size={18} />
                返回
              </button>
              <h2 className="text-lg font-bold">编辑个人档案</h2>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? '保存中' : '保存'}
              </button>
            </div>

            {/* 表单 */}
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                <h3 className="font-bold text-sm text-gray-800">基本信息</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">身高 (cm)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editForm.height}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, height: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">体重 (kg)</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editForm.weight}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, weight: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">年龄</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editForm.age}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, age: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">性别</label>
                  <div className="flex gap-3">
                    {['男', '女'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setEditForm((prev) => ({ ...prev, gender: g }))}
                        className={`flex-1 h-10 rounded-xl border-2 text-sm font-medium transition-colors ${
                          editForm.gender === g
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 身体目标 */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-800">身体目标</h3>
                {goalOptions.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setEditForm((prev) => ({ ...prev, goal: g.key }))}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                      editForm.goal === g.key
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`font-bold ${editForm.goal === g.key ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {g.label}
                    </div>
                    <div className={`text-xs mt-0.5 ${editForm.goal === g.key ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {g.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* 饮食偏好 */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-800">饮食偏好（多选）</h3>
                {/* 固定标签候选池 */}
                <div className="flex flex-wrap gap-2">
                  {prefOptions.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePref(p)}
                      className={`px-4 h-9 rounded-full border-2 text-sm font-medium transition-colors ${
                        editForm.diet_preference.includes(p)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {editForm.diet_preference.includes(p) ? '✓ ' : '+ '}{p}
                    </button>
                  ))}
                </div>
                {/* 自定义标签输入 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="添加自定义标签"
                    value={editForm.customPrefInput || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, customPrefInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = editForm.customPrefInput?.trim();
                        if (val && !editForm.diet_preference.includes(val)) {
                          setEditForm((prev) => ({
                            ...prev,
                            diet_preference: [...prev.diet_preference, val],
                            customPrefInput: '',
                          }));
                        }
                      }
                    }}
                    className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    onClick={() => {
                      const val = editForm.customPrefInput?.trim();
                      if (val && !editForm.diet_preference.includes(val)) {
                        setEditForm((prev) => ({
                          ...prev,
                          diet_preference: [...prev.diet_preference, val],
                          customPrefInput: '',
                        }));
                      }
                    }}
                    className="h-10 px-4 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                  >
                    添加
                  </button>
                </div>
                {/* 已选标签统一展示 */}
                {editForm.diet_preference.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editForm.diet_preference.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 px-3 h-8 rounded-full bg-emerald-50 text-emerald-700 text-sm border border-emerald-200"
                      >
                        {p}
                        <button
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              diet_preference: prev.diet_preference.filter((x) => x !== p),
                            }))
                          }
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-200 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 忌口 */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">忌口信息</label>
                <input
                  type="text"
                  placeholder="例如：海鲜过敏、不吃香菜"
                  value={editForm.forbidden_food}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, forbidden_food: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* 运动频率 */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block">每周运动频率</label>
                <div className="flex gap-2">
                  {freqOptions.map((f) => (
                    <button
                      key={f}
                      onClick={() => setEditForm((prev) => ({ ...prev, sport_frequency: f }))}
                      className={`flex-1 h-10 rounded-xl border-2 text-sm font-medium transition-colors ${
                        editForm.sport_frequency === f
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ActivityLogDialog open={showDialog} onOpenChange={setShowDialog} onSuccess={() => toast.success('运动数据已更新')} />
    </div>
  );
};

export default Profile;
