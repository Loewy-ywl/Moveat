
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BasicInfoStep from '@/components/onboarding/BasicInfoStep';
import GoalStep from '@/components/onboarding/GoalStep';
import PreferenceStep from '@/components/onboarding/PreferenceStep';

const steps = ['基本信息', '身体目标', '饮食偏好'];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState(null);
  const [goal, setGoal] = useState(null);
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [frequency, setFrequency] = useState(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [forbidden, setForbidden] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  const isGuest = !!localStorage.getItem('moveat_guest_id');

  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }
    if (isGuest) {
      const guestProfile = JSON.parse(localStorage.getItem('moveat_guest_profile') || 'null');
      if (guestProfile) {
        setHeight(guestProfile.height?.toString() || '');
        setWeight(guestProfile.weight?.toString() || '');
        setAge(guestProfile.age?.toString() || '');
        setGender(guestProfile.gender || null);
        const reverseGoalMap = { fat_loss: '减脂', muscle_gain: '增肌', maintain: '保持体型' };
        setGoal(reverseGoalMap[guestProfile.goal] || null);
        setSelectedPrefs(guestProfile.diet_preference ? guestProfile.diet_preference.split(',').filter(Boolean) : []);
        setForbidden(guestProfile.forbidden_food || '');
        setFrequency(guestProfile.sport_frequency || null);
      }
      setLoading(false);
      return;
    }
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const { data } = await supabase.from('users').select('*').eq('user_id', user.id).maybeSingle();
        if (data) {
          setHeight(data.height?.toString() || '');
          setWeight(data.weight?.toString() || '');
          setAge(data.age?.toString() || '');
          setGender(data.gender || null);
          const reverseGoalMap = { fat_loss: '减脂', muscle_gain: '增肌', maintain: '保持体型' };
          setGoal(reverseGoalMap[data.goal] || null);
          setSelectedPrefs(data.diet_preference ? data.diet_preference.split(',').filter(Boolean) : []);
          setForbidden(data.forbidden_food || '');
          setFrequency(data.sport_frequency || null);
        }
      } catch (err) {
        console.error('加载档案失败:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [isEditMode, isGuest]);

  const togglePref = (t) => setSelectedPrefs((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const next = async () => {
    if (step < 2) return setStep((s) => s + 1);
    setSaving(true);
    try {
      const goalMap = { '减脂': 'fat_loss', '增肌': 'muscle_gain', '保持体型': 'maintain' };
      const payload = {
        name: localStorage.getItem('moveat_guest_name') || localStorage.getItem('moveat_nickname') || 'Moveat 用户',
        height: parseInt(height) || 175,
        weight: parseInt(weight) || 70,
        age: parseInt(age) || 25,
        gender: gender || '',
        goal: goalMap[goal] || 'maintain',
        diet_preference: selectedPrefs.join(','),
        forbidden_food: forbidden,
        sport_frequency: frequency || '',
      };

      if (isGuest) {
        localStorage.setItem('moveat_guest_profile', JSON.stringify({ ...payload, user_id: localStorage.getItem('moveat_guest_id') || '' }));
        toast.success('档案保存成功（游客模式）');
        nav('/home');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('未检测到登录状态，请重新登录');
        nav('/login');
        return;
      }
      const { error } = await supabase.from('users').upsert({ ...payload, user_id: user.id }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success(isEditMode ? '信息修改成功' : '档案保存成功');
      nav(isEditMode ? '/profile' : '/home');
    } catch (err) {
      console.error('保存档案失败:', err);
      toast.error(err.message || '保存档案失败，请检查网络后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto px-6 py-8 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 py-8">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        {steps.map((s, i) => (
          <span key={s} className={i <= step ? 'text-primary font-medium' : ''}>{s}</span>
        ))}
      </div>
      <div className="flex gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <h2 className="text-2xl font-bold mb-6">{steps[step]}</h2>
          {step === 0 && <BasicInfoStep {...{ height, setHeight, weight, setWeight, age, setAge, gender, setGender }} />}
          {step === 1 && <GoalStep {...{ goal, setGoal }} />}
          {step === 2 && <PreferenceStep {...{ selectedPrefs, togglePref, forbidden, setForbidden, frequency, setFrequency }} />}
        </motion.div>
      </AnimatePresence>
      <Button onClick={next} disabled={saving} className={`w-full mt-8 h-12 ${step === 2 ? 'bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]' : ''}`}>
        {saving ? '保存中...' : step === 2 ? '完成' : '下一步'}
      </Button>
    </div>
  );
};

export default Onboarding;

