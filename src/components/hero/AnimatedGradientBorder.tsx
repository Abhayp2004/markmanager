import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedGradientBorderProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedGradientBorder({ children, className = '' }: AnimatedGradientBorderProps) {
  return (
    <div className={`relative rounded-2xl p-[1px] overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'conic-gradient(from 0deg, hsl(187 72% 40%), hsl(192 85% 45%), hsl(172 66% 50%), hsl(187 72% 40%))',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative rounded-2xl bg-card">
        {children}
      </div>
    </div>
  );
}
