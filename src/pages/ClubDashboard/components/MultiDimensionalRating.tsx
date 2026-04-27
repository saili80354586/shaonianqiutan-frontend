import React from 'react';
import { Star } from 'lucide-react';

interface RatingDimension {
  key: string;
  label: string;
  description?: string;
}

interface MultiDimensionalRatingProps {
  dimensions: RatingDimension[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const MultiDimensionalRating: React.FC<MultiDimensionalRatingProps> = ({
  dimensions,
  values,
  onChange,
  readOnly = false,
  size = 'md',
  showLabels = true,
}) => {
  const sizeClasses = {
    sm: {
      star: 'w-4 h-4',
      label: 'text-xs',
      desc: 'text-xs',
      gap: 'gap-1',
    },
    md: {
      star: 'w-5 h-5',
      label: 'text-sm',
      desc: 'text-xs',
      gap: 'gap-1.5',
    },
    lg: {
      star: 'w-6 h-6',
      label: 'text-base',
      desc: 'text-sm',
      gap: 'gap-2',
    },
  };

  const classes = sizeClasses[size];

  const handleStarClick = (key: string, rating: number) => {
    if (!readOnly) {
      onChange(key, rating);
    }
  };

  return (
    <div className="space-y-4">
      {dimensions.map((dim) => (
        <div key={dim.key} className="flex items-center justify-between">
          <div className="flex-1">
            {showLabels && (
              <>
                <div className={`font-medium text-white ${classes.label}`}>
                  {dim.label}
                </div>
                {dim.description && (
                  <div className={`text-gray-500 mt-0.5 ${classes.desc}`}>
                    {dim.description}
                  </div>
                )}
              </>
            )}
          </div>
          <div className={`flex items-center ${classes.gap}`}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = (values[dim.key] || 0) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(dim.key, star)}
                  disabled={readOnly}
                  className={`transition-all duration-200 ${
                    readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                  }`}
                >
                  <Star
                    className={`${classes.star} transition-colors duration-200 ${
                      isActive
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-600 hover:text-gray-500'
                    }`}
                  />
                </button>
              );
            })}
            {values[dim.key] > 0 && (
              <span className="ml-2 text-sm font-medium text-amber-400 w-6">
                {values[dim.key]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// 预设维度配置
export const COACH_RATING_DIMENSIONS: RatingDimension[] = [
  {
    key: 'coachAttitudeRating',
    label: '训练态度',
    description: '球员在训练中的积极性、专注度和努力程度',
  },
  {
    key: 'coachTechniqueRating',
    label: '技术执行',
    description: '技术动作的规范性和熟练度',
  },
  {
    key: 'coachTacticsRating',
    label: '战术理解',
    description: '对战术安排的理解和执行能力',
  },
  {
    key: 'coachKnowledgeRating',
    label: '知识点掌握',
    description: '本周技术/战术知识点的掌握程度',
  },
];

export const SELF_RATING_DIMENSIONS: RatingDimension[] = [
  {
    key: 'selfAttitudeRating',
    label: '训练态度',
    description: '我对训练的投入程度',
  },
  {
    key: 'selfTechniqueRating',
    label: '技术表现',
    description: '我对技术练习的满意度',
  },
  {
    key: 'selfTeamworkRating',
    label: '团队协作',
    description: '我与队友的配合情况',
  },
];

export default MultiDimensionalRating;
