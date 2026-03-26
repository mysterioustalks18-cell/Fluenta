import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

export const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
  }, [spring]);

  return <span>{displayValue.toLocaleString()}</span>;
};

export const ShimmerSkeleton = ({ className }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-bg-raised rounded-xl ${className}`}>
    <div className="absolute inset-0 shimmer" />
  </div>
);

export const AnimatedEN = () => (
  <motion.div 
    className="relative flex items-center justify-center"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 1, ease: "easeOut" }}
  >
    <motion.span 
      className="text-8xl font-display font-black text-primary select-none"
      animate={{ 
        textShadow: [
          "0 0 20px rgba(255, 107, 53, 0.3)",
          "0 0 40px rgba(255, 107, 53, 0.6)",
          "0 0 20px rgba(255, 107, 53, 0.3)"
        ]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      EN
    </motion.span>
    <motion.div 
      className="absolute -inset-4 border-2 border-primary/20 rounded-full"
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.2, 0.5, 0.2],
        rotate: [0, 180, 360]
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
    />
    <motion.div 
      className="absolute -inset-8 border border-primary/10 rounded-full"
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.1, 0.3, 0.1],
        rotate: [360, 180, 0]
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    />
  </motion.div>
);
