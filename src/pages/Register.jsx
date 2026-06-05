import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, Zap } from 'lucide-react';
import { useAnonymousLogin } from '@/hooks/useAnonymousLogin';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login: handleAnonymous, loading: anonLoading } = useAnonymousLogin();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('请填写邮箱和密码');
      return;
    }
    if (password.length < 6) {
      toast.error('密码长度至少需要 6 位');
      return;
    }
    setLoading(true);
    try {
      // 第一步：尝试注册
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

      // 情况A：邮箱已注册 → 直接登录进首页
      if (signUpError?.message?.includes('already registered') || signUpError?.message?.includes('already been registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (signInData.session) {
          toast.success('欢迎回来，已自动登录');
          nav('/home');
          return;
        }
      }

      if (signUpError) throw signUpError;

      // 情况B：注册成功，判断新老用户
      let session = signUpData.session;
      let userId = signUpData.user?.id;

      // 如果 signUp 没返回 session（邮箱确认模式），尝试自动登录
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError && signInData.session) {
          // 自动登录成功
          session = signInData.session;
          userId = signInData.user?.id;
        }
        // 如果自动登录也失败（未确认邮箱），不报错，继续走新用户流程
      }

      // 有 session 且能查到 userId → 判断是否有档案
      if (session && userId) {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingProfile) {
          // 老用户：已有档案 → 首页
          toast.success('欢迎回来，已自动登录');
          nav('/home');
          return;
        }
      }

      // 新用户（无论有没有 session）：进入 onboarding 填写个人信息
      toast.success('注册成功');
      nav('/onboarding');

    } catch (err) {
      console.error('注册异常:', err);
      const msg = err.message || '';
      if (msg.includes('rate limit') || msg.includes('exceeded')) {
        toast.error('注册请求过于频繁，请稍等几分钟后再试，或直接使用已注册账号登录');
      } else {
        toast.error(msg || '注册失败，请检查网络或更换邮箱重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 py-8 flex flex-col justify-center">
      <h1 className="text-2xl font-bold mb-2 text-center">注册 Moveat</h1>
      <p className="text-center text-sm text-muted-foreground mb-6">
        创建账号，开启 AI 健康饮食之旅
      </p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <Label htmlFor="reg-email">邮箱</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="reg-password">密码</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入至少6位密码"
              className="pl-10"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]"
          disabled={loading}
        >
          {loading ? '注册中...' : '注册'}
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        <Button variant="link" className="w-full" onClick={() => nav('/login')}>
          已有账号？去登录
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">或者</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleAnonymous}
          disabled={anonLoading}
        >
          <Zap size={16} className="mr-2 text-emerald-500" />
          {anonLoading ? '正在进入游客模式...' : '免注册，直接体验'}
        </Button>
      </div>
    </div>
  );
};

export default Register;
