import { motion } from 'motion/react';
import { AlertTriangle, Lightbulb, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../lib/utils';

interface AIInsightCardProps {
  type: 'warning' | 'tip' | 'achievement' | 'info';
  title: string;
  message: string;
  context?: string;
  details?: string;
  className?: string;
  animated?: boolean;
  actionable?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bgGradient: 'from-red-500/10 to-red-500/5',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
  },
  tip: {
    icon: Lightbulb,
    bgGradient: 'from-blue-500/10 to-blue-500/5',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  achievement: {
    icon: TrendingUp,
    bgGradient: 'from-green-500/10 to-green-500/5',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
  },
  info: {
    icon: Info,
    bgGradient: 'from-purple-500/10 to-purple-500/5',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
  },
};

export default function AIInsightCard({
  type,
  title,
  message,
  context,
  details,
  className,
  animated = true,
  actionable = false,
  onAction,
  actionLabel = 'Take Action',
}: AIInsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300',
        config.bgGradient,
        config.borderColor,
        className
      )}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={cn('p-3 rounded-xl flex-shrink-0', config.iconBg)}>
            <Icon className={cn('w-5 h-5', config.iconColor)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-700 leading-relaxed">{message}</p>
            
            {/* Context pill */}
            {context && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                {context}
              </div>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {details && (
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 leading-relaxed">{details}</p>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          {details && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isExpanded ? 'Show less' : 'Why this insight?'}
            </button>
          )}

          {actionable && onAction && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAction}
              className="px-4 py-2 bg-gradient-to-r from-[#1B4FFF] to-[#00C896] text-white rounded-xl font-medium shadow-lg shadow-[#1B4FFF]/30 hover:shadow-xl transition-all"
            >
              {actionLabel}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
