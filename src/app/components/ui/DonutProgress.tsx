import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';

interface DonutProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  backgroundColor?: string;
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const colorClasses = {
  primary: '#1B4FFF',
  secondary: '#00C896',
  accent: '#FF6B35',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export default function DonutProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = 'primary',
  backgroundColor = '#E5E7EB',
  showPercentage = true,
  showLabel = false,
  label,
  animated = true,
  className,
}: DonutProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorClasses[color]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : false}
          animate={animated ? { strokeDashoffset } : false}
          transition={{ duration: 1, ease: 'easeInOut' }}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.div
            initial={animated ? { scale: 0.8, opacity: 0 } : false}
            animate={animated ? { scale: 1, opacity: 1 } : false}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-bold text-gray-900"
          >
            {Math.round(percentage)}%
          </motion.div>
        )}
        
        {showLabel && label && (
          <div className="text-xs text-gray-600 text-center mt-1">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
