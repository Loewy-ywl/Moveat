import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const OtpForm = ({ email, onBack, type = 'signup', onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('请输入完整的 6 位验证码');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type });
      if (error) throw error;
      if (data.session) {
        toast.success('验证成功，已自动登录');
        onSuccess(data.session);
      } else {
        toast.error('验证失败，请重试');
      }
    } catch (err) {
      console.error('验证异常:', err);
      toast.error(err.message || '验证码错误，请检查后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type, email });
      if (error) throw error;
      toast.success('验证码已重新发送，请查看邮箱');
    } catch (err) {
      toast.error(err.message || '发送失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" /> 返回
      </button>
      <p className="text-center text-sm text-muted-foreground">验证码已发送至 {email}</p>
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button
        type="submit"
        className="w-full bg-[#FFC300] text-gray-900 hover:bg-[#e6b000]"
        disabled={loading || otp.length < 6}
      >
        {loading ? '验证中...' : '完成验证'}
      </Button>
      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          没有收到？重新发送验证码
        </button>
      </div>
    </form>
  );
};

export default OtpForm;
