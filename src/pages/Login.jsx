import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, Zap } from 'lucide-react';
import OtpForm from '@/components/auth/OtpForm';
import { useAnonymousLogin } from '@/hooks/useAnonymousLogin';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login: handleAnonymous, loading: anonLoading } = useAnonymousLogin();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('请填写邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Email not confirmed') || error.code === 'email_not_confirmed') {
          toast.error('邮箱尚未验证，请完成验证');
          setStep('verify');
          return;
        }
        throw error;
      }
      if (data.session) {
        toast.success('登录成功');
        nav('/home');
      }
    } catch (err) {
      console.error('登录异常:', err);
      toast.error(err.message || '登录失败，请检查网络或账号信息');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 py-8 flex flex-col justify-center">
      <h1 className="text-2xl font-bold mb-2 text-center">
        {step === 'form' ? '登录 Moveat' : '验证邮箱'}
      </h1>
      <p className="text-center text-sm text-muted-foreground mb-6">
        {step === 'form' ? '欢迎回来，继续你的健康之旅' : '请输入邮箱收到的 6 位验证码'}
      </p>

      {step === 'form' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="login-email">邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="login-email"
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
            <Label htmlFor="login-password">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="pl-10"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
      ) : (
        <OtpForm email={email} type="signup" onBack={() => setStep('form')} onSuccess={() => nav('/home')} />
      )}

      <div className="mt-6 space-y-3">
        <Button variant="link" className="w-full" onClick={() => nav('/register')}>
          还没有账号？去注册
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

export default Login;
