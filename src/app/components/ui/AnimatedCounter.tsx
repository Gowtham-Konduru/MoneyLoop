import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from '../../../lib/utils';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'default';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

const colorClasses = {
  primary: 'text-[#1B4FFF]',
  secondary: 'text-[#00C896]',
  accent: 'text-[#FF6B35]',
  default: 'text-gray-900',
};

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 2,
  className,
  size = 'lg',
  color = 'default',
  animated = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    setIsAnimating(true);
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;
    const change = endValue - startValue;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + change * easeOutQuart;
      
      setDisplayValue(currentValue);

      if (progress >= 1) {
        clearInterval(timer);
        setIsAnimating(false);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, animated]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return Math.round(num).toString();
  };

  return (
    <div className={cn('font-bold', sizeClasses[size], colorClasses[color], className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={displayValue}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-baseline"
        >
          <span>{prefix}</span>
          <span>${formatNumber(displayValue)}</span>
          <span>{suffix}</span>
          {isAnimating && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="ml-1 text-xs"
            >
              *
            </motion.span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
