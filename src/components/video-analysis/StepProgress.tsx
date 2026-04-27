import React from 'react';
import { motion } from 'framer-motion';
import { Check, Upload, User, CreditCard, Clock, FileText } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  icon: React.ReactNode;
}

interface StepProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps: Step[] = [
  { id: 1, label: '上传视频', icon: <Upload className="w-4 h-4" /> },
  { id: 2, label: '选择分析师', icon: <User className="w-4 h-4" /> },
  { id: 3, label: '下单付费', icon: <CreditCard className="w-4 h-4" /> },
  { id: 4, label: '等待分析', icon: <Clock className="w-4 h-4" /> },
  { id: 5, label: '查看报告', icon: <FileText className="w-4 h-4" /> },
];

const StepProgress: React.FC<StepProgressProps> = ({ currentStep, onStepClick }) => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700/50 rounded-full" />
          
          {/* Progress Line Fill */}
          <motion.div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              const isClickable = onStepClick && step.id < currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-2 ${
                    isClickable ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => isClickable && onStepClick(step.id)}
                >
                  {/* Step Circle */}
                  <motion.div
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : isActive
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-400/50'
                        : 'bg-slate-800 text-slate-400 border border-slate-600'
                    }`}
                    initial={false}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                    
                    {/* Pulse Animation for Active Step */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-emerald-500"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Step Label */}
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${
                      isCompleted
                        ? 'text-emerald-400'
                        : isActive
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
