import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StepProgress from '../components/video-analysis/StepProgress';
import Step1Upload from '../components/video-analysis/Step1Upload';
import Step2SelectAnalyst from '../components/video-analysis/Step2SelectAnalyst';
import Step3OrderConfirm from '../components/video-analysis/Step3OrderConfirm';
import Step4Waiting from '../components/video-analysis/Step4Waiting';
import Step5ViewReport from '../components/video-analysis/Step5ViewReport';

const FORM_STORAGE_KEY = 'videoAnalysisFormDraft';
const ORDER_STORAGE_KEY = 'videoAnalysisOrderData';

interface OrderData {
  videos?: any[];
  playerInfo?: any;
  analystId?: string;
  analystInfo?: any;
  orderResult?: any;
  [key: string]: any;
}

const VideoAnalysisNew: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState<OrderData>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // 页面加载时恢复订单数据
  useEffect(() => {
    const savedOrder = sessionStorage.getItem(ORDER_STORAGE_KEY);
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        setOrderData(parsed.data || {});
        setCurrentStep(parsed.step || 1);
      } catch (e) {
        console.error('Failed to restore order data:', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // 订单数据变化时保存
  useEffect(() => {
    if (isInitialized) {
      sessionStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify({
          step: currentStep,
          data: orderData,
        })
      );
    }
  }, [currentStep, orderData, isInitialized]);

  const handleStep1Next = (data: any) => {
    setOrderData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Next = (data: any) => {
    setOrderData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Prev = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep3Next = (data: any) => {
    setOrderData((prev) => ({ ...prev, orderResult: data }));
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep3Prev = () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep4Next = () => {
    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (step: number) => {
    // 只允许点击已完成的步骤
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToHome = () => {
    navigate('/video-analysis');
  };

  // 清除订单数据
  const clearOrderData = () => {
    sessionStorage.removeItem(ORDER_STORAGE_KEY);
    localStorage.removeItem(FORM_STORAGE_KEY);
    setOrderData({});
    setCurrentStep(1);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">返回首页</span>
            </button>
            <h1 className="text-xl font-bold text-white">比赛视频分析</h1>
            <div className="w-20" /> {/* Spacer for center alignment */}
          </div>
        </div>
      </header>

      {/* Step Progress */}
      <StepProgress currentStep={currentStep} onStepClick={handleStepClick} />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step1Upload
                onNext={handleStep1Next}
                initialData={orderData}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step2SelectAnalyst
                onNext={handleStep2Next}
                onPrev={handleStep2Prev}
                initialData={orderData}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step3OrderConfirm
                onNext={handleStep3Next}
                onPrev={handleStep3Prev}
                orderData={orderData}
              />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step4Waiting
                onNext={handleStep4Next}
                orderData={orderData}
              />
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step5ViewReport orderData={orderData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="bg-slate-900/50 border-t border-slate-800 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            少年球探 · 专业足球视频分析服务
          </p>
          {currentStep === 5 && (
            <button
              onClick={clearOrderData}
              className="mt-4 text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              开始新的分析订单
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default VideoAnalysisNew;
