import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, RefreshCw, Flame, Droplets, Scale, Activity, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeeklySummary } from '@/hooks/useWeeklySummary';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((item, idx) => (
        <p key={idx} className="flex items-center gap-1.5" style={{ color: item.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}: {item.value}
          {item.dataKey === 'weight' ? 'kg' : 'kcal'}
        </p>
      ))}
    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value, unit, color }) => (
  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
      <Icon size={16} className="text-white" />
    </div>
    <div>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800">
        {value}<span className="text-[10px] font-normal text-gray-400 ml-0.5">{unit}</span>
      </p>
    </div>
  </div>
);

const ChartSkeleton = ({ height }) => (
  <div style={{ height }} className="flex flex-col items-center justify-center gap-2 text-sm text-gray-400">
    <RefreshCw size={20} className="animate-spin text-emerald-400" />
    <span>加载中...</span>
  </div>
);

const SummarySkeleton = () => (
  <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
    <Sparkles size={16} className="animate-pulse text-emerald-400" />
    <span>AI 正在分析本周数据...</span>
  </div>
);

const HealthDashboard = ({ data, loading: dataLoading }) => {
  const { summary, loading: summaryLoading, refresh } = useWeeklySummary();
  const chartData = data || [];

  // 计算本周统计
  const weekStats = chartData.reduce(
    (acc, d) => ({
      totalIntake: acc.totalIntake + (d.intake || 0),
      totalBurn: acc.totalBurn + (d.burn || 0),
      avgWeight: acc.avgWeight + (d.weight || 0),
      count: acc.count + (d.weight ? 1 : 0),
    }),
    { totalIntake: 0, totalBurn: 0, avgWeight: 0, count: 0 }
  );

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">我的健康数据看板</h3>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-400 hover:text-emerald-600" onClick={refresh} disabled={summaryLoading}>
          <RefreshCw size={14} className={summaryLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* 本周统计卡片 - 不依赖 AI，直接展示 */}
      <div className="grid grid-cols-3 gap-2">
        <StatBadge
          icon={Flame}
          label="本周摄入"
          value={weekStats.totalIntake}
          unit="kcal"
          color="bg-orange-500"
        />
        <StatBadge
          icon={Activity}
          label="本周消耗"
          value={weekStats.totalBurn}
          unit="kcal"
          color="bg-emerald-500"
        />
        <StatBadge
          icon={Scale}
          label="平均体重"
          value={weekStats.count ? (weekStats.avgWeight / weekStats.count).toFixed(1) : '--'}
          unit="kg"
          color="bg-blue-500"
        />
      </div>

      {/* 热量图表 */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-orange-500" />
            </div>
            热量摄入 vs 消耗
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-2">
          {dataLoading ? (
            <ChartSkeleton height={220} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="intakeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="intake" stroke="#f97316" strokeWidth={2.5} fill="url(#intakeGradient)" name="摄入"
                  dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="burn" stroke="#10b981" strokeWidth={2.5} fill="url(#burnGradient)" name="消耗"
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 体重图表 */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Droplets size={14} className="text-blue-500" />
            </div>
            体重变化趋势
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-2">
          {dataLoading ? (
            <ChartSkeleton height={200} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} name="体重"
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* AI 周总结 - 单独 loading */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
            <Sparkles size={14} className="text-emerald-500" />
            AI 周总结
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 leading-relaxed px-4 pb-4">
          {summaryLoading ? (
            <SummarySkeleton />
          ) : (
            summary || '本周数据已记录，继续保持健康的生活习惯，合理搭配饮食与运动。'
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthDashboard;
