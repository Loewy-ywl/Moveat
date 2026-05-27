import { Home, UtensilsCrossed, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const tabs = [
    { path: '/home', icon: Home, label: '首页' },
    { path: '/recommend', icon: UtensilsCrossed, label: '外卖推荐' },
    { path: '/chat', icon: MessageCircle, label: 'AI助手' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  if (['/', '/onboarding', '/login', '/register'].includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {tabs.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center p-2 ${location.pathname === path ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Icon size={20} />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
