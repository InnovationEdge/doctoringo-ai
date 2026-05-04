import { motion } from 'motion/react';

interface DoctorLogoProps {
  className?: string;
  isThinking?: boolean;
}

export function DoctorLogo({ className = "", isThinking = false }: DoctorLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="relative">
        <motion.img
          src="/doctoringo-logo.png"
          alt="Doctoringo AI"
          className="w-full h-full object-contain"
          animate={isThinking ? {
            scale: [1, 1.05, 1],
            opacity: [1, 0.7, 1],
          } : {}}
          transition={isThinking ? {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          } : {}}
        />

        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-[#033C81]/20 rounded-full blur-xl -z-10"
          />
        )}
      </div>
    </div>
  );
}
