import React from 'react';
import { motion } from 'motion/react';
const Motion = motion;

interface DoctorLogoProps {
  className?: string;
  isThinking?: boolean;
}

/**
 * The primary brand logo for Doctoringo AI.
 * Uses the original Doctoringo logo SVG file.
 */
export function DoctorLogo({ className = "", isThinking = false }: DoctorLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="relative">
        <Motion.img
          src="/doctoringo-logo.png"
          alt="Doctoringo AI"
          className="w-full h-full object-contain"
          animate={isThinking ? { opacity: [1, 0.6, 1] } : {}}
          transition={isThinking ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
        />

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
