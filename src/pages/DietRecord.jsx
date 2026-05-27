import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDietLogs } from '@/hooks/useDietLogs';
import DietLogDialog from '@/components/DietLogDialog';
import DietLogList from '@/components/DietLogList';
import { getLocalDateStr } from '@/lib/date';

const getWeekDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push({
      dateStr: `${year}-${month}-${day}`,
      dayName: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
      dateNum: d.getDate(),
      isToday: i === 0,
    });
  }
  return days;
};

const DietRecord = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr());
  const { dietLogs, addDietLog, updateDietLog, deleteDietLog } = useDietLogs(selectedDate);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const weekDays = getWeekDays();

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
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} className="p-2 hover:bg-accent rounded-full">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">饮食打卡</h1>
      </div>

      <div className="flex justify-between gap-1 mb-6 overflow-x-auto pb-2">
        {weekDays.map((d) => (
          <button
            key={d.dateStr}
            onClick={() => setSelectedDate(d.dateStr)}
            className={`flex flex-col items-center justify-center min-w-[48px] h-16 rounded-xl transition-colors ${
              selectedDate === d.dateStr
                ? 'bg-emerald-500 text-white'
                : 'bg-muted hover:bg-accent'
            }`}
          >
            <span className="text-xs">{d.dayName}</span>
            <span className="text-lg font-bold">{d.dateNum}</span>
            {d.isToday && <span className="text-[10px]">今天</span>}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="font-bold text-sm mb-3">{isToday ? '今日记录' : selectedDate} 的餐食</h2>
        <DietLogList logs={dietLogs} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4">
        <Button
          onClick={() => { setEditingItem(null); setDialogOpen(true); }}
          className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000] h-12 shadow-lg"
        >
          <Plus size={18} className="mr-2" /> 添加记录
        </Button>
      </div>

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
