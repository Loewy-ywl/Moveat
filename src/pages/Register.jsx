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

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('form');
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
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        toast.success('注册成功');
        nav('/onboarding');
      } else {
        toast.success('验证码已发送至您的邮箱，请输入 6 位验证码完成注册');
        setStep('verify');
      }
    } catch (err) {
      console.error('注册异常:', err);
      toast.error(err.message || '注册失败，请检查网络或更换邮箱重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto px-6 py-8 flex flex-col justify-center">
      <h1 className="text-2xl font-bold mb-2 text-center">
        {step === 'form' ? '注册 Moveat' : '验证邮箱'}
      </h1>
      <p className="text-center text-sm text-muted-foreground mb-6">
        {step === 'form' ? '创建账号，开启 AI 健康饮食之旅' : '请输入邮箱收到的 6 位验证码'}
      </p>

      {step === 'form' ? (
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
      ) : (
        <OtpForm email={email} type="signup" onBack={() => setStep('form')} onSuccess={() => nav('/onboarding')} />
      )}

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
