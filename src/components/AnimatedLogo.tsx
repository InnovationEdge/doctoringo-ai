import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
const Motion = motion;

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
}

export function AnimatedLogo({ 
  className = "", 
  size = "md", 
  isThinking = false 
}: AnimatedLogoProps) {
  const sizeMap = {
    sm: "w-6 h-5",
    md: "w-10 h-8",
    lg: "w-14 h-11",
    xl: "w-20 h-16"
  };

  // Dimensions for the book parts based on relative sizing
  return (
    <div className={`relative ${sizeMap[size]} ${className}`} style={{ perspective: '1200px' }}>
      <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        {/* Book Spine */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#8b5a41] -translate-x-1/2 z-10 rounded-full shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
        
        {/* Left Page (Fixed) */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#fdfaf6] border-y border-l border-[#033C81]/30 rounded-l-[2px] origin-right"
          style={{ 
            boxShadow: 'inset -10px 0 15px rgba(0,0,0,0.05)',
            background: 'linear-gradient(to right, #fdfaf6 0%, #f4eee1 100%)'
          }}
        >
          {/* Faint Text Lines on Left Page */}
          <div className="absolute inset-2 flex flex-col gap-1 opacity-10">
            <div className="w-full h-[1px] bg-[#033C81]" />
            <div className="w-3/4 h-[1px] bg-[#033C81]" />
            <div className="w-full h-[1px] bg-[#033C81]" />
            <div className="w-1/2 h-[1px] bg-[#033C81]" />
          </div>
        </div>

        {/* Right Page (Fixed) */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#fdfaf6] border-y border-r border-[#033C81]/30 rounded-r-[2px] origin-left"
          style={{ 
            boxShadow: 'inset 10px 0 15px rgba(0,0,0,0.05)',
            background: 'linear-gradient(to left, #fdfaf6 0%, #f4eee1 100%)'
          }}
        >
           {/* Faint Text Lines on Right Page */}
           <div className="absolute inset-2 flex flex-col gap-1 opacity-10">
            <div className="w-full h-[1px] bg-[#033C81]" />
            <div className="w-full h-[1px] bg-[#033C81]" />
            <div className="w-2/3 h-[1px] bg-[#033C81]" />
            <div className="w-full h-[1px] bg-[#033C81]" />
          </div>
        </div>

        {/* Flipping Page */}
        <Motion.div
          className="absolute right-0 top-0 bottom-0 w-1/2 origin-left z-20"
          style={{ transformStyle: 'preserve-3d' }}
          animate={isThinking ? {
            rotateY: [0, -180]
          } : { rotateY: 0 }}
          transition={isThinking ? {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 0.1
          } : { duration: 0.5 }}
        >
          {/* Front of the flipping page */}
          <div 
            className="absolute inset-0 bg-[#fdfaf6] border-y border-r border-[#033C81]/30 rounded-r-[2px]"
            style={{ 
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(to left, #fdfaf6 0%, #f4eee1 100%)',
              boxShadow: 'inset 5px 0 10px rgba(0,0,0,0.05)'
            }}
          >
            <div className="absolute inset-2 flex flex-col gap-1 opacity-10">
              <div className="w-full h-[1px] bg-[#033C81]" />
              <div className="w-full h-[1px] bg-[#033C81]" />
              <div className="w-full h-[1px] bg-[#033C81]" />
            </div>
          </div>
          
          {/* Back of the flipping page */}
          <div 
            className="absolute inset-0 bg-[#fdfaf6] border-y border-l border-[#033C81]/30 rounded-l-[2px]"
            style={{ 
              backfaceVisibility: 'hidden', 
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(to right, #fdfaf6 0%, #f4eee1 100%)',
              boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.05)'
            }}
          >
             <div className="absolute inset-2 flex flex-col gap-1 opacity-10">
              <div className="w-full h-[1px] bg-[#033C81]" />
              <div className="w-full h-[1px] bg-[#033C81]" />
              <div className="w-full h-[1px] bg-[#033C81]" />
            </div>
          </div>
        </Motion.div>

        {/* Secondary Flipping Page (Slightly delayed for more realism) */}
        {isThinking && (
          <Motion.div
            className="absolute right-0 top-0 bottom-0 w-1/2 origin-left z-10"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: [0, -180] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
              repeatDelay: 0.1
            }}
          >
            <div 
              className="absolute inset-0 bg-[#fdfaf6] border-y border-r border-[#033C81]/30 rounded-r-[2px]"
              style={{ backfaceVisibility: 'hidden', background: '#fdfaf6' }}
            />
            <div 
              className="absolute inset-0 bg-[#fdfaf6] border-y border-l border-[#033C81]/30 rounded-l-[2px]"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: '#fdfaf6' }}
            />
          </Motion.div>
        )}
      </div>
    </div>
  );
}

export function ThinkingLoader() {
  return (
    <div className="flex items-center justify-center py-2 w-fit">
      <Motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="relative w-5 h-5"
      >
        {[...Array(8)].map((_, i) => (
          <Motion.div
            key={i}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[6px] bg-[#033C81] rounded-full origin-[center_10px]"
            style={{ 
              transform: `rotate(${i * 45}deg)`,
              opacity: 0.3 + (i * 0.1)
            }}
            animate={{ 
              opacity: [0.2, 1, 0.2],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </Motion.div>
    </div>
  );
}
