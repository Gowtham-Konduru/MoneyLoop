import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface MoneyLoopLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export default function MoneyLoopLogo({ 
  size = 'md', 
  className = '', 
  animated = true 
}: MoneyLoopLogoProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Handle image loading errors
  const handleImageError = () => {
    console.log('Logo image failed to load, using fallback');
    setImgError(true);
  };

  // Handle successful image load
  const handleImageLoad = () => {
    setImgLoaded(true);
  };

  // Fallback logo if image fails to load
  if (imgError) {
    return (
      <motion.div
        whileHover={animated ? { rotate: 360 } : undefined}
        transition={animated ? { duration: 0.5 } : undefined}
        className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-[#1B4FFF] to-[#00C896] rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}
      >
        ML
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className} flex items-center justify-center`}
    >
      <img
        src="/app%20logo.png"
        alt="MoneyLoop Logo"
        className={`max-w-full max-h-full object-contain ${
          imgLoaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{
          imageRendering: 'crisp-edges',
          WebkitFontSmoothing: 'antialiased'
        }}
      />
      {!imgLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4FFF]/20 to-[#00C896]/20 rounded-xl flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-[#1B4FFF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </motion.div>
  );
}
