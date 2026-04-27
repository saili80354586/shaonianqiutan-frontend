import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

type Step = 1 | 2 | 3;

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [sentCode, setSentCode] = useState('');

  // Password requirements validation
  const passwordRequirements = {
    length: newPassword.length >= 6 && newPassword.length <= 20,
    hasNumber: /\d/.test(newPassword),
    hasLetter: /[a-zA-Z]/.test(newPassword),
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendVerifyCode = async () => {
    const newErrors: Record<string, string> = {};
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '请输入正确的11位手机号';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setSendingCode(true);
      await authApi.sendCode(phone, 'reset');
      setErrors({});
      setCountdown(60);
      // In dev mode, show demo code
      if (import.meta.env.DEV) {
        setSentCode('123456');
        setTimeout(() => {
          alert(`验证码已发送至 ${phone}\n演示验证码：123456`);
        }, 500);
      }
    } catch (err: any) {
      setErrors({ phone: err.response?.data?.error || '发送验证码失败' });
    } finally {
      setSendingCode(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      newErrors.phone = '请输入正确的11位手机号';
    }
    if (!code || code.length !== 6) {
      newErrors.code = '请输入6位验证码';
    }
    if (code !== sentCode && import.meta.env.DEV) {
      newErrors.code = '验证码错误';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setVerifiedPhone(phone);
      setStep(2);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!passwordRequirements.length || !passwordRequirements.hasNumber || !passwordRequirements.hasLetter) {
      newErrors.password = '密码不符合要求';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirm = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      try {
        await authApi.resetPassword({
          phone: verifiedPhone,
          code: code,
          password: newPassword,
        });
        setStep(3);
      } catch (err: any) {
        setErrors({ submit: err.response?.data?.error || '重置密码失败' });
      }
    }
  };

  const goToStep = (newStep: Step) => {
    setStep(newStep);
  };

  const stepDescriptions = {
    1: '请输入注册时的手机号',
    2: '请设置您的新密码',
    3: '密码重置完成',
  };

  return (
    <div className="bg-gradient-to-br from-secondary to-primary min-h-screen flex items-center justify-center pt-[72px] pb-10 px-5">
      <div className="w-full max-w-[420px] bg-white rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="text-center mb-8">
          <h1 className="text-primary text-2xl font-bold mb-2">找回密码</h1>
          <p className="text-slate-500" id="stepDescription">
            {stepDescriptions[step]}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-5 mb-8">
          {[1, 2, 3].map((stepNum) => (
            <div 
              key={stepNum} 
              className={`flex flex-col items-center gap-2 ${
                step === stepNum ? 'active' : step > stepNum ? 'completed' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                step >= stepNum 
                  ? 'bg-accent text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {step > stepNum ? '✓' : stepNum}
              </div>
              <span className={`text-xs ${step === stepNum ? 'text-accent font-semibold' : 'text-slate-500'}`}>
                {stepNum === 1 ? '验证手机' : stepNum === 2 ? '设置密码' : '完成'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Phone & Code */}
        {step === 1 && (
          <div className="block">
            <form onSubmit={handleStep1Submit}>
              <div className="mb-6">
                <label className="block text-primary font-semibold mb-2 text-sm">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入注册手机号"
                  maxLength={11}
                  className={`w-full px-3.5 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                    errors.phone ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.phone && (
                  <div className="text-red-500 text-sm mt-1.5 block">{errors.phone}</div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-primary font-semibold mb-2 text-sm">验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    className={`flex-1 px-3.5 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                      errors.code ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    className="px-5 py-3.5 bg-accent text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all whitespace-nowrap hover:bg-accent-light disabled:bg-slate-300 disabled:cursor-not-allowed"
                    onClick={sendVerifyCode}
                    disabled={sendingCode || countdown > 0}
                  >
                    {countdown > 0 ? `${countdown}秒后重试` : sendingCode ? '发送中...' : '获取验证码'}
                  </button>
                </div>
                {errors.code && (
                  <div className="text-red-500 text-sm mt-1.5 block">{errors.code}</div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-accent text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all hover:bg-accent-light"
              >
                下一步
              </button>
            </form>
          </div>
        )}

        {/* Step 2: New Password */}
        {step === 2 && (
          <div className="block">
            <form onSubmit={handleStep2Submit}>
              <div className="mb-6">
                <label className="block text-primary font-semibold mb-2 text-sm">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请设置6-20位新密码"
                  className={`w-full px-3.5 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                    errors.password ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.password && (
                  <div className="text-red-500 text-sm mt-1.5 block">{errors.password}</div>
                )}

                <div className="mt-3 p-4 bg-slate-50 rounded-xl text-sm">
                  <h4 className="mb-2 text-primary font-semibold">密码要求</h4>
                  <ul className="list-none p-0 m-0">
                    <li className={`py-1 flex items-center gap-2 ${passwordRequirements.length ? 'text-green-600 valid' : 'text-slate-500'}`}>
                      6-20位字符
                    </li>
                    <li className={`py-1 flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-green-600 valid' : 'text-slate-500'}`}>
                      包含数字
                    </li>
                    <li className={`py-1 flex items-center gap-2 ${passwordRequirements.hasLetter ? 'text-green-600 valid' : 'text-slate-500'}`}>
                      包含字母
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-primary font-semibold mb-2 text-sm">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  className={`w-full px-3.5 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                    errors.confirm ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.confirm && (
                  <div className="text-red-500 text-sm mt-1.5 block">{errors.confirm}</div>
                )}
              </div>

              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                  {errors.submit}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-accent text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all hover:bg-accent-light"
              >
                重置密码
              </button>
              <button
                type="button"
                className="w-full py-4 mt-3 bg-transparent text-primary border-2 border-slate-200 rounded-xl text-base font-semibold cursor-pointer transition-all"
                onClick={() => goToStep(1)}
              >
                返回上一步
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="block">
            <div className="text-center py-10 px-5">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-primary text-2xl font-bold mb-3">密码重置成功！</h2>
              <p className="text-slate-500 mb-6">您的密码已成功重置，请使用新密码登录</p>
              <Link 
                to="/login" 
                className="inline-block w-full text-center py-4 bg-accent text-white rounded-xl text-base font-semibold no-underline hover:bg-accent-light"
              >
                立即登录
              </Link>
            </div>
          </div>
        )}

        {step !== 3 && (
          <div className="text-center mt-6" id="backLink">
            <Link to="/login" className="text-accent no-underline">
              ← 返回登录
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
