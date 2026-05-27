import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeeklySummary } from '@/hooks/useWeeklySummary';

const HealthDashboard = ({ data }) => {
  const { summary, loading, refresh } = useWeeklySummary();
  const chartData = data || [];

  return (
    <div className="space-y-4">
      <h3 className="font-bold">我的健康数据看板</h3>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp size={16} /> 热量摄入 vs 消耗
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="intake" stroke="#f97316" fill="#f97316" fillOpacity={0.1} name="摄入" />
              <Area type="monotone" dataKey="burn" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="消耗" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">体重变化趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="体重(kg)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">AI 周总结</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          {loading ? '正在分析本周数据并生成总结...' : (summary || '本周数据已记录，继续保持健康的生活习惯，合理搭配饮食与运动。')}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthDashboard;
