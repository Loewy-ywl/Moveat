import { Footprints, Flame, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const HomeStats = ({ calories, steps }) => (
  <div className="grid grid-cols-2 gap-3 mb-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="text-orange-500" size={20} />
          <ShoppingBag className="text-[#FFC300]" size={16} />
        </div>
        <div className="text-2xl font-bold">{calories}</div>
        <div className="text-xs text-muted-foreground">千卡消耗</div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4">
        <Footprints className="text-blue-500 mb-2" size={20} />
        <div className="text-2xl font-bold">{steps.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">今日步数</div>
      </CardContent>
    </Card>
  </div>
);

export default HomeStats;
