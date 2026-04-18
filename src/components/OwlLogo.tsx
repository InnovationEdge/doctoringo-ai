import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
const Motion = motion;

interface OwlLogoProps {
  className?: string;
  isThinking?: boolean;
}

/**
 * The primary brand logo for Doctoringo AI.
 * Updated with a minimalistic page-swiping animation for the "thinking" state.
 */
export function OwlLogo({ className = "", isThinking = false }: OwlLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="relative" style={{ perspective: '1000px' }}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Static Left Page (The Base) */}
          <path 
            d="M2 3H8C10.2091 3 12 4.79086 12 7V21C12 19.3431 10.6569 18 9 18H2V3Z" 
            stroke="#033C81" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* Static Right Page (The Base) */}
          <path 
            d="M22 3H16C13.7909 3 12 4.79086 12 7V21C12 19.3431 13.3431 18 15 18H22V3Z" 
            stroke="#033C81" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={isThinking ? "opacity-40" : "opacity-100"}
          />

          {/* Animating Flipping Page */}
          {isThinking && (
            <Motion.path
              d="M22 3H16C13.7909 3 12 4.79086 12 7V21C12 19.3431 13.3431 18 15 18H22V3Z"
              stroke="#033C81"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ originX: "12px", originY: "12px" }}
              animate={{ 
                rotateY: [0, -180],
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.8, 1]
              }}
            />
          )}
        </svg>

        {/* Subtle glow for "thinking" state */}
        {isThinking && (
          <Motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#033C81]/10 rounded-full blur-xl animate-pulse -z-10" 
          />
        )}
      </div>
    </div>
  );
}
