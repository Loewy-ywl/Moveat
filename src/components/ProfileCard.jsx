import { Card, CardContent } from '@/components/ui/card';
import { Target, Ruler, Weight, Pencil } from 'lucide-react';

const ProfileCard = ({ profile, onEdit, loading }) => {
  const goalLabel = { fat_loss: '减脂', muscle_gain: '增肌', maintain: '保持体型' };
  const tags = profile?.diet_preference ? profile.diet_preference.split(',').filter(Boolean) : [];

  if (loading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">个人档案</h3>
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-gray-100 animate-pulse" />
              <span className="text-muted-foreground">身高</span>
              <div className="ml-auto w-12 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-gray-100 animate-pulse" />
              <span className="text-muted-foreground">体重</span>
              <div className="ml-auto w-12 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mb-3">
            <div className="w-4 h-4 rounded bg-gray-100 animate-pulse" />
            <span className="text-muted-foreground">当前目标</span>
            <div className="ml-auto w-16 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-12 h-6 bg-gray-100 rounded animate-pulse" />
            <div className="w-12 h-6 bg-gray-100 rounded animate-pulse" />
            <div className="w-16 h-6 bg-gray-100 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">个人档案</h3>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="编辑个人档案"
          >
            <Pencil size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Ruler size={16} className="text-emerald-500" />
            <span className="text-muted-foreground">身高</span>
            <span className="font-medium ml-auto">{profile?.height || '--'} cm</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Weight size={16} className="text-emerald-500" />
            <span className="text-muted-foreground">体重</span>
            <span className="font-medium ml-auto">{profile?.weight || '--'} kg</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm mb-3">
          <Target size={16} className="text-emerald-500" />
          <span className="text-muted-foreground">当前目标</span>
          <span className="font-medium ml-auto">{goalLabel[profile?.goal] || '--'}</span>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs">{tag}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
