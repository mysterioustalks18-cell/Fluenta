import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-6 h-6 border-2 border-primary rounded-full pointer-events-none z-[9999] flex items-center justify-center"
      animate={{
        x: position.x - 12,
        y: position.y - 12,
        scale: isPointer ? 1.5 : 1,
        backgroundColor: isPointer ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 107, 53, 0)',
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.5 }}
    >
      <div className="w-1 h-1 bg-primary rounded-full" />
    </motion.div>
  );
};

export const FloatingOrb = ({ color, size, delay, top, left }: { color: string, size: string, delay: number, top?: string, left?: string }) => (
  <motion.div
    className={`fixed rounded-full blur-[120px] opacity-20 pointer-events-none ${color} ${size}`}
    style={{ top: top || '0%', left: left || '0%' }}
    animate={{
      x: [0, 100, -100, 0],
      y: [0, -100, 100, 0],
      scale: [1, 1.2, 0.9, 1],
    }}
    transition={{
      duration: 25,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  />
);

export const ParticleSystem = ({ x, y, onComplete }: { x: number, y: number, onComplete: () => void, key?: number }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x, y, scale: 1, opacity: 1 }}
          animate={{
            x: x + (Math.random() - 0.5) * 200,
            y: y + (Math.random() - 0.5) * 200,
            scale: 0,
            opacity: 0
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute w-2 h-2 rounded-full bg-gold"
        />
      ))}
    </div>
  );
};
