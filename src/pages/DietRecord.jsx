import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Flame, Dumbbell, Wheat as WheatIcon, Droplets, CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDietLogs } from '@/hooks/useDietLogs';
import DietLogDialog from '@/components/DietLogDialog';
import DietLogList from '@/components/DietLogList';
import { getLocalDateStr } from '@/lib/date';
import { supabase } from '@/integrations/supabase/client';

// 计算营养目标（和首页 useHomeData 一样的逻辑）
const calculateNutritionGoals = (profile) => {
  if (!profile) {
    return { calorie: 2000, protein: 120, carb: 250, fat: 60 };
  }
  const weight = profile.weight || 70;
  const height = profile.height || 175;
  const age = profile.age || 25;
  const gender = profile.gender || '男';

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr += gender === '女' ? -161 : 5;
  bmr = Math.round(bmr);

  const freqMap = { '1-2次': 1.375, '3-4次': 1.55, '5次以上': 1.725 };
  const multiplier = freqMap[profile.sport_frequency] || 1.55;
  let tdee = Math.round(bmr * multiplier);

  const goal = profile.goal;
  if (goal === 'fat_loss') tdee -= 500;
  else if (goal === 'muscle_gain') tdee += 300;

  let protein;
  if (goal === 'fat_loss') protein = Math.round(weight * 2.0);
  else if (goal === 'muscle_gain') protein = Math.round(weight * 2.2);
  else protein = Math.round(weight * 1.6);

  const fat = Math.round(tdee * 0.25 / 9);
  const carb = Math.round((tdee - protein * 4 - fat * 9) / 4);

  return {
    calorie: Math.max(tdee, 1200),
    protein: Math.max(protein, 50),
    carb: Math.max(carb, 50),
    fat: Math.max(fat, 20),
  };
};

const getWeekDays = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const todayStr = getLocalDateStr();

    days.push({
      dateStr,
      dayName: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
      dateNum: d.getDate(),
      isToday: dateStr === todayStr,
      fullDate: d,
    });
  }
  return days;
};

// 日历弹窗
const CalendarPicker = ({ selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate + 'T00:00:00'));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const days = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);
  const todayStr = getLocalDateStr();

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-[15vh] bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-[320px] shadow-xl h-fit" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500 shrink-0">←</button>
          <span className="font-bold text-gray-800 w-28 text-center">{year}年 {month + 1}月</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500 shrink-0">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <span key={d} className="text-xs text-gray-400 py-1">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;
            return (
              <button
                key={idx}
                onClick={() => { onSelect(dateStr); onClose(); }}
                className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                  isSelected ? 'bg-emerald-500 text-white' : isToday ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t flex justify-between">
          <button onClick={() => { onSelect(todayStr); onClose(); }} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">今天</button>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
        </div>
      </div>
    </div>
  );
};

// 环形进度条组件
const CircularProgress = ({ value, max, size = 56, strokeWidth = 5, color = '#f97316', label, unit }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f3f4f6" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-800">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 mt-1">{label}</span>
      <span className="text-xs font-medium text-gray-600">{value}/{max}{unit}</span>
    </div>
  );
};

// 线性进度条
const LinearProgress = ({ value, max, color, label }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">{value}/{max}g</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const DietRecord = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [showCalendar, setShowCalendar] = useState(false);
  const { dietLogs, addDietLog, updateDietLog, deleteDietLog, todaySummary, loading } = useDietLogs(selectedDate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [nutritionGoals, setNutritionGoals] = useState({ calorie: 2000, protein: 120, carb: 250, fat: 60 });

  // 加载用户档案，计算营养目标
  useEffect(() => {
    const loadGoals = async () => {
      const isGuest = !!localStorage.getItem('moveat_guest_id');
      if (isGuest) {
        const guestProfile = JSON.parse(localStorage.getItem('moveat_guest_profile') || 'null');
        setNutritionGoals(calculateNutritionGoals(guestProfile));
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('users').select('*').eq('user_id', user.id).maybeSingle();
        setNutritionGoals(calculateNutritionGoals(profile));
      } catch (err) {
        console.error('加载营养目标失败:', err);
      }
    };
    loadGoals();
  }, []);

  const weekDays = getWeekDays();
  const summary = todaySummary();

  const handleSubmit = async (payload) => {
    if (editingItem) {
      await updateDietLog(editingItem.id, payload);
    } else {
      await addDietLog({ ...payload, date: selectedDate });
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleEdit = (log) => {
    setEditingItem(log);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteDietLog(id);
  };

  const isToday = selectedDate === getLocalDateStr();

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/profile')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">饮食打卡</h1>
        </div>

        {/* 日期选择器 */}
        <div className="relative">
          <div className="flex gap-1.5">
            {weekDays.map((d) => (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`flex-1 flex flex-col items-center justify-center h-[64px] rounded-2xl transition-all duration-200 relative ${
                  selectedDate === d.dateStr
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : d.isToday
                    ? 'bg-emerald-50 text-gray-700 border-2 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.isToday && selectedDate !== d.dateStr && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                )}
                <span className="text-[11px] font-medium opacity-80">{d.dayName}</span>
                <span className="text-lg font-bold leading-tight">{d.dateNum}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <CalendarDays size={14} />
              <span>{selectedDate}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {loading ? (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-emerald-500" />
            </div>
            <p className="text-sm text-gray-400">加载中...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 统计卡片 */}
          <div className="px-4 mt-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-gray-800">
                  {isToday ? '今日营养' : `${selectedDate} 营养`}
                </h2>
                <span className="text-xs text-gray-400">{dietLogs.length} 条记录</span>
              </div>

              {/* 热量环形进度 */}
              <div className="flex items-center gap-4 mb-5">
                <CircularProgress
                  value={summary.calorie}
                  max={nutritionGoals.calorie}
                  color="#f97316"
                  label="热量"
                  unit="kcal"
                />
                <div className="flex-1 space-y-3">
                  <LinearProgress value={summary.protein} max={nutritionGoals.protein} color="bg-blue-400" label="蛋白质" />
                  <LinearProgress value={summary.carb} max={nutritionGoals.carb} color="bg-amber-400" label="碳水" />
                  <LinearProgress value={summary.fat} max={nutritionGoals.fat} color="bg-rose-400" label="脂肪" />
                </div>
              </div>

              {/* 三大营养素数字 */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Dumbbell size={14} className="text-blue-500" />
                    <span className="text-[10px] text-blue-600">蛋白质</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{summary.protein}<span className="text-xs font-normal text-gray-400">g</span></div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <WheatIcon size={14} className="text-amber-500" />
                    <span className="text-[10px] text-amber-600">碳水</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{summary.carb}<span className="text-xs font-normal text-gray-400">g</span></div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Droplets size={14} className="text-rose-500" />
                    <span className="text-[10px] text-rose-600">脂肪</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{summary.fat}<span className="text-xs font-normal text-gray-400">g</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* 饮食记录列表 */}
          <div className="px-4 mt-4 pb-24">
            <DietLogList logs={dietLogs} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        </>
      )}

      {/* 悬浮添加按钮 */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => { setEditingItem(null); setDialogOpen(true); }}
          className="w-14 h-14 bg-[#FFC300] text-gray-900 rounded-full shadow-lg shadow-orange-200 flex items-center justify-center hover:bg-[#e6b000] hover:scale-105 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* 日历弹窗 */}
      {showCalendar && (
        <CalendarPicker selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setShowCalendar(false)} />
      )}

      <DietLogDialog
        open={dialogOpen}
        onOpenChange={(open) => { if (!open) setEditingItem(null); setDialogOpen(open); }}
        editingItem={editingItem}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default DietRecord;
