import { Pencil, Trash2, Utensils, Coffee, Sun, Moon, Cookie, ImageOff } from 'lucide-react';

const mealConfig = {
  '早餐': { icon: Coffee, color: 'bg-sky-50 text-sky-600', borderColor: 'border-sky-100' },
  '午餐': { icon: Sun, color: 'bg-amber-50 text-amber-600', borderColor: 'border-amber-100' },
  '晚餐': { icon: Moon, color: 'bg-indigo-50 text-indigo-600', borderColor: 'border-indigo-100' },
  '加餐': { icon: Cookie, color: 'bg-pink-50 text-pink-600', borderColor: 'border-pink-100' },
};

const getMealStyle = (mealPeriod) => {
  return mealConfig[mealPeriod] || { icon: Utensils, color: 'bg-gray-50 text-gray-600', borderColor: 'border-gray-100' };
};

const NutritionBar = ({ label, value, color, max = 100 }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-8">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-500 w-8 text-right">{value}g</span>
    </div>
  );
};

const DietLogList = ({ logs, onEdit, onDelete }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Utensils size={24} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">暂无饮食记录</p>
        <p className="text-xs text-gray-400 mt-1">点击底部按钮添加第一餐</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-800">已记录餐食</h3>
      </div>

      {logs.map((log) => {
        const { icon: MealIcon, color, borderColor } = getMealStyle(log.meal_period);
        const hasImage = log.image_url && log.image_url.trim() !== '';

        return (
          <div
            key={log.id}
            className={`bg-white rounded-2xl border ${borderColor} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="p-3.5">
              <div className="flex gap-3">
                {/* 左侧：图片或餐次图标 */}
                <div className="shrink-0">
                  {hasImage ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={log.image_url}
                        alt={log.food_name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`w-16 h-16 rounded-xl ${color} flex flex-col items-center justify-center`}>
                      <MealIcon size={20} />
                      <span className="text-[10px] font-medium mt-0.5">{log.meal_period}</span>
                    </div>
                  )}
                </div>

                {/* 右侧：信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {hasImage && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${color}`}>
                            {log.meal_period}
                          </span>
                        )}
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{log.food_name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-bold text-orange-500">{log.calorie} kcal</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => onEdit(log)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(log.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 营养条 */}
                  <div className="space-y-1">
                    <NutritionBar label="蛋白质" value={log.protein || 0} color="bg-blue-400" max={50} />
                    <NutritionBar label="碳水" value={log.carb || 0} color="bg-amber-400" max={100} />
                    <NutritionBar label="脂肪" value={log.fat || 0} color="bg-rose-400" max={40} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DietLogList;
