import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Trophy, TrendingUp } from 'lucide-react';

const data = [
  { day: '周一', intake: 1800, burn: 2200, weight: 70.5 },
  { day: '周二', intake: 1950, burn: 2100, weight: 70.3 },
  { day: '周三', intake: 1700, burn: 2400, weight: 70.1 },
  { day: '周四', intake: 1850, burn: 2300, weight: 69.9 },
  { day: '周五', intake: 2000, burn: 2000, weight: 69.8 },
  { day: '周六', intake: 1600, burn: 2500, weight: 69.6 },
  { day: '周日', intake: 1750, burn: 2350, weight: 69.5 },
];

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">健康数据分析</h1>

      <Card className="mb-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-4 flex items-center gap-4">
          <Trophy className="text-amber-500" size={32} />
          <div>
            <div className="font-bold text-amber-900">你的减脂进度超过了全国 80% 的用户</div>
            <div className="text-xs text-amber-700">本周累计热量缺口 2,450 千卡</div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp size={16} /> 热量摄入 vs 消耗
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
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

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">体重变化趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="体重(kg)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">AI 周总结</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          本周你的运动表现非常稳定，平均每日热量缺口约 350 千卡。建议下周适当增加蛋白质摄入比例，并继续保持有氧训练的频率。
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
