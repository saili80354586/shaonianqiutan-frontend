import React, { useState, useEffect } from 'react';
import { Smartphone, Lock, Shield, Eye, EyeOff, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../../../services/api';

interface Step1AccountProps {
  onNext: (data: { phone: string; password: string; code: string }) => void;
  defaultValues?: {
    phone?: string;
    password?: string;
    confirmPassword?: string;
    verifyCode?: string;
  };
}

const Step1Account: React.FC<Step1AccountProps> = ({ onNext, defaultValues }) => {
  const [phone, setPhone] = useState(defaultValues?.phone || '');
  const [code, setCode] = useState(defaultValues?.verifyCode || '');
  const [password, setPassword] = useState(defaultValues?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(defaultValues?.confirmPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeSentFeedback, setCodeSentFeedback] = useState(false);
  const [touched, setTouched] = useState({
    phone: false,
    code: false,
    password: false,
    confirmPassword: false,
  });

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 手机号格式验证（更精确）
  const isPhoneValid = /^1[3-9]\d{9}$/.test(phone);
  const isPhonePartial = phone.length > 0 && phone.length < 11;

  // 验证规则
  const validations = {
    phone: phone.length === 11 && isPhoneValid,
    code: code.length === 6,
    password: password.length >= 6,
    confirmPassword: password === confirmPassword && confirmPassword.length > 0,
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || !isPhoneValid) {
      setError('请输入正确的手机号');
      return;
    }
    setIsSending(true);
    setError('');
    try {
      // 调用后端发送验证码 API
      const response: any = await authApi.sendCode(phone, 'register');
      setCountdown(60);
      setCodeSent(true);
      setCodeSentFeedback(true);
      // 开发模式：后端返回固定验证码 123456，自动填充
      if (import.meta.env.DEV && response.data?.code) {
        setCode(response.data.code);
      }
      // 3秒后隐藏成功提示（不影响 codeSent 状态）
      setTimeout(() => setCodeSentFeedback(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || '验证码发送失败，请重试');
    } finally {
      setIsSending(false);
    }
  };

  // 验证并下一步
  const handleNext = () => {
    setTouched({ phone: true, code: true, password: true, confirmPassword: true });

    if (!validations.phone) {
      setError('请输入正确的手机号');
      return;
    }
    if (!codeSent) {
      setError('请先获取验证码');
      return;
    }
    if (!validations.code) {
      setError('请输入6位验证码');
      return;
    }
    if (!validations.password) {
      setError('密码长度至少为6位');
      return;
    }
    if (!validations.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setError('');
    onNext({ phone, password, code });
  };

  // 计算密码强度
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  };

  const strength = getPasswordStrength();
  const strengthLabels = ['弱', '中', '强', '非常强'];
  const strengthColors = ['bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 标题 - PC端更紧凑 */}
      <div className="text-center mb-4 sm:mb-6 lg:mb-8">
        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1.5">创建账号</h2>
        <p className="text-blue-200/60 text-sm">请输入您的手机号并设置密码</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2 text-sm">
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm flex-shrink-0">!</div>
          <span className="break-all">{error}</span>
        </div>
      )}

      {/* 表单内容 - 使用grid布局在PC端更宽 */}
      <div className="space-y-4 sm:space-y-5">
        {/* 手机号 */}
        <div>
          <label className="block text-blue-200/80 font-medium mb-1.5 text-sm">
            手机号 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
              placeholder="请输入手机号"
              maxLength={11}
              className={`w-full pl-12 pr-10 py-3 sm:py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-base ${
                touched.phone && !validations.phone && phone.length > 0
                  ? 'border-red-500/50'
                  : isPhoneValid
                  ? 'border-green-500/50'
                  : 'border-white/10'
              }`}
            />
            {isPhoneValid && (
              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
            )}
            {touched.phone && isPhonePartial && !isPhoneValid && (
              <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
            )}
          </div>
          {touched.phone && !validations.phone && phone.length > 0 && (
            <p className="mt-1 text-red-400 text-xs">请输入11位有效手机号</p>
          )}
        </div>

        {/* 验证码 */}
        <div>
          <label className="block text-blue-200/80 font-medium mb-1.5 text-sm">
            验证码 <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => setTouched(prev => ({ ...prev, code: true }))}
                placeholder="请输入6位验证码"
                maxLength={6}
                className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-base tracking-[0.3em] text-center ${
                  touched.code && !validations.code ? 'border-red-500/50' : 'border-white/10'
                }`}
              />
              {validations.code && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              )}
            </div>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={countdown > 0 || !isPhoneValid || isSending}
              className={`px-4 sm:px-5 py-3 sm:py-3.5 font-medium rounded-xl transition-all whitespace-nowrap text-sm min-w-[100px] sm:min-w-[110px] flex items-center justify-center gap-2 ${
                codeSentFeedback
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                  : isSending
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                  : countdown > 0
                  ? 'bg-white/5 border border-white/10 text-white/50'
                  : isPhoneValid
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/5 border border-white/10 text-white/30'
              } disabled:cursor-not-allowed`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  发送中
                </>
              ) : codeSentFeedback ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  已发送
                </>
              ) : countdown > 0 ? (
                `${countdown}s`
              ) : (
                '获取验证码'
              )}
            </button>
          </div>
          {codeSentFeedback && (
            <p className="mt-1.5 text-emerald-400 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              验证码已发送，请注意查收
            </p>
          )}
        </div>

        {/* 密码和确认密码 - PC端并排 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* 密码 */}
          <div>
            <label className="block text-blue-200/80 font-medium mb-1.5 text-sm">
              设置密码 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                placeholder="至少6位"
                minLength={6}
                className={`w-full pl-12 pr-12 py-3 sm:py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-base ${
                  touched.password && !validations.password ? 'border-red-500/50' : 'border-white/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 确认密码 */}
          <div>
            <label className="block text-blue-200/80 font-medium mb-1.5 text-sm">
              确认密码 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                placeholder="再次输入密码"
                minLength={6}
                className={`w-full pl-12 pr-12 py-3 sm:py-3.5 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-base ${
                  touched.confirmPassword && !validations.confirmPassword && confirmPassword.length > 0
                    ? 'border-red-500/50'
                    : validations.confirmPassword && confirmPassword.length > 0
                    ? 'border-green-500/50'
                    : 'border-white/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {touched.confirmPassword && !validations.confirmPassword && confirmPassword.length > 0 && (
              <p className="mt-1 text-red-400 text-xs">密码不一致</p>
            )}
          </div>
        </div>

        {/* 密码强度提示 */}
        {password && (
          <div className="flex items-center gap-3 text-xs sm:text-sm flex-wrap">
            <span className="text-blue-200/60">密码强度：</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`w-8 sm:w-10 h-1.5 rounded-full transition-all duration-300 ${
                    strength > level ? strengthColors[strength - 1] : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className={`font-medium ${strengthColors[strength - 1]?.replace('bg-', 'text-') || 'text-white/40'}`}>
              {strengthLabels[strength - 1] || '弱'}
            </span>
          </div>
        )}
      </div>

      {/* 下一步按钮 */}
      <button
        type="button"
        onClick={handleNext}
        className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-6 sm:mt-8"
      >
        下一步
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* 已有账号 */}
      <div className="text-center text-blue-200/50 text-sm pt-2">
        已有账号？
        <a href="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors ml-1">
          立即登录
        </a>
      </div>
    </div>
  );
};

export default Step1Account;
