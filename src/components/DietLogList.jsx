import { Pencil, Trash2 } from 'lucide-react';

const DietLogList = ({ logs, onEdit, onDelete }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">暂无饮食记录</p>
        <p className="text-xs text-muted-foreground mt-1">点击底部按钮添加第一餐</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-sm">已记录餐食</h3>
      {logs.map((log) => (
        <div key={log.id} className="bg-white border rounded-xl p-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full shrink-0">{log.meal_period}</span>
              <span className="font-medium text-sm truncate">{log.food_name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {log.calorie} kcal · 蛋白质 {log.protein || 0}g · 碳水 {log.carb || 0}g · 脂肪 {log.fat || 0}g
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button onClick={() => onEdit(log)} className="p-2 hover:bg-accent rounded-full text-muted-foreground">
              <Pencil size={14} />
            </button>
            <button onClick={() => onDelete(log.id)} className="p-2 hover:bg-accent rounded-full text-muted-foreground">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DietLogList;
