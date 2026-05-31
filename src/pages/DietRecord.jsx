import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Flame, Dumbbell, Wheat as WheatIcon, Droplets, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDietLogs } from '@/hooks/useDietLogs';
import DietLogDialog from '@/components/DietLogDialog';
import DietLogList from '@/components/DietLogList';
import { getLocalDateStr } from '@/lib/date';

const getWeekDays = (centerDateStr) => {
  const days = [];
  const center = new Date(centerDateStr + 'T00:00:00');
  // 以选中日期为中心，前后各3天
  for (let i = -3; i <= 3; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
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

// 简单的日历弹窗组件
const CalendarPicker = ({ selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate + 'T00:00:00'));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay(); // 0=周日

  const days = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);

  const todayStr = getLocalDateStr();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-[320px] shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            ←
          </button>
          <span className="font-bold text-gray-800">{year}年 {month + 1}月</span>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            →
          </button>
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
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : isToday
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t flex justify-between">
          <button
            onClick={() => { onSelect(todayStr); onClose(); }}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            今天
          </button>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

const DietRecord = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const [showCalendar, setShowCalendar] = useState(false);
  const { dietLogs, addDietLog, updateDietLog, deleteDietLog, todaySummary } = useDietLogs(selectedDate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const weekDays = getWeekDays(selectedDate);
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

        {/* 日期选择器 - 以选中日期为中心 */}
        <div className="relative">
          <div className="flex justify-between gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {weekDays.map((d) => (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[52px] h-[68px] rounded-2xl transition-all duration-200 ${
                  selectedDate === d.dateStr
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-[11px] font-medium">{d.dayName}</span>
                <span className="text-lg font-bold leading-tight">{d.dateNum}</span>
                {d.isToday && (
                  <span className="text-[9px] font-medium mt-0.5">今天</span>
                )}
              </button>
            ))}
          </div>

          {/* 日历按钮 */}
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

      {/* 统计卡片 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-800">
              {isToday ? '今日营养' : `${selectedDate} 营养`}
            </h2>
            <span className="text-xs text-gray-400">{dietLogs.length} 条记录</span>
          </div>

          {/* 热量大数字 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Flame size={22} className="text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{summary.calorie}</div>
              <div className="text-xs text-gray-400">总热量 kcal</div>
            </div>
          </div>

          {/* 三大营养素 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Dumbbell size={14} className="text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">蛋白质</span>
              </div>
              <div className="text-lg font-bold text-gray-900">{summary.protein}<span className="text-xs font-normal text-gray-400 ml-0.5">g</span></div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <WheatIcon size={14} className="text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">碳水</span>
              </div>
              <div className="text-lg font-bold text-gray-900">{summary.carb}<span className="text-xs font-normal text-gray-400 ml-0.5">g</span></div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Droplets size={14} className="text-rose-500" />
                <span className="text-xs text-rose-600 font-medium">脂肪</span>
              </div>
              <div className="text-lg font-bold text-gray-900">{summary.fat}<span className="text-xs font-normal text-gray-400 ml-0.5">g</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 饮食记录列表 */}
      <div className="px-4 mt-4 pb-24">
        <DietLogList logs={dietLogs} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

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
        <CalendarPicker
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          onClose={() => setShowCalendar(false)}
        />
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
