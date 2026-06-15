import { motion } from 'motion/react';
import { Calendar, Filter, Database } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ContextPillProps {
  context: string;
  type?: 'date' | 'account' | 'data';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const typeConfig = {
  date: {
    icon: Calendar,
    bgGradient: 'from-blue-500/10 to-blue-500/5',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  account: {
    icon: Filter,
    bgGradient: 'from-purple-500/10 to-purple-500/5',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
  },
  data: {
    icon: Database,
    bgGradient: 'from-green-500/10 to-green-500/5',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
};

export default function ContextPill({
  context,
  type = 'data',
  animated = true,
  className,
  onClick,
}: ContextPillProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.3 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200',
        config.bgGradient,
        config.borderColor,
        config.textColor,
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <Icon className="w-3 h-3" />
      <span>Using: {context}</span>
    </motion.div>
  );
}
