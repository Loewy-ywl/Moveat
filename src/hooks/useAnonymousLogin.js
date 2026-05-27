import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useAnonymousLogin = () => {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const login = async () => {
    setLoading(true);
    try {
      const guestId = `guest_${Date.now()}`;
      localStorage.setItem('moveat_guest_id', guestId);
      localStorage.setItem('moveat_guest_name', '游客用户');
      window.dispatchEvent(new Event('moveat-guest-change'));
      toast.success('已进入游客模式');
      nav('/home');
    } catch (err) {
      console.error('游客模式异常:', err);
      toast.error('进入游客模式失败');
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};
