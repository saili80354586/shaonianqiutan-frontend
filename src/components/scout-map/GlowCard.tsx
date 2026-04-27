import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

export function GlowCard({ 
  children, 
  className = '', 
  glowColor = 'rgba(16, 185, 129, 0.3)',
  delay = 0 
}: GlowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative group ${className}`}
    >
      {/* Glow effect */}
      <div 
        className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"
        style={{ background: `linear-gradient(135deg, ${glowColor}, transparent 50%)` }}
      />
      
      {/* Card content */}
      <div className="relative rounded-2xl overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}
