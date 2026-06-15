import { motion } from 'motion/react';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
  animated?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
}

const colorClasses = {
  primary: 'from-[#1B4FFF] to-[#1B4FFF]/80',
  secondary: 'from-[#00C896] to-[#00C896]/80',
  accent: 'from-[#FF6B35] to-[#FF6B35]/80',
  success: 'from-green-500 to-green-500/80',
  warning: 'from-yellow-500 to-yellow-500/80',
  error: 'from-red-500 to-red-500/80',
};

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  className,
  animated = true,
  color = 'primary',
}: StatCardProps) {
  const getTrendIcon = () => {
    if (changeType === 'increase') return <TrendingUp className="w-4 h-4" />;
    if (changeType === 'decrease') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (changeType === 'increase') return 'text-green-600';
    if (changeType === 'decrease') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {icon && (
            <div className={cn('p-2 rounded-xl bg-gradient-to-br', colorClasses[color])}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-3">
          <motion.div
            initial={animated ? { scale: 0.8 } : false}
            animate={animated ? { scale: 1 } : false}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-2xl font-bold text-gray-900"
          >
            {value}
          </motion.div>
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <motion.div
            initial={animated ? { opacity: 0 } : false}
            animate={animated ? { opacity: 1 } : false}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}
          >
            {getTrendIcon()}
            <span>{Math.abs(change)}%</span>
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
