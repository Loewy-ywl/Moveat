import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

const ProfileActionCard = ({ icon: Icon, colorClass, textClass, title, desc, onClick }) => (
  <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onClick}>
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${colorClass} ${textClass} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <ChevronRight size={18} className="text-muted-foreground" />
    </CardContent>
  </Card>
);

export default ProfileActionCard;
