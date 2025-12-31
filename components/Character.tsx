import React from 'react';
import { motion } from 'framer-motion';

interface CharacterProps {
  mood: 'happy' | 'thinking' | 'celebrating' | 'idle';
  message?: string;
}

const Character: React.FC<CharacterProps> = ({ mood, message }) => {
  return (
    <div className="flex flex-col items-center justify-end h-full">
      {/* Speech Bubble */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 relative bg-white px-6 py-4 rounded-3xl shadow-lg border-2 border-sparkle-accent max-w-xs text-center"
        >
          <p className="font-bold text-gray-700 text-lg font-sans leading-tight">{message}</p>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-sparkle-accent rotate-45"></div>
        </motion.div>
      )}

      {/* Character Graphic (CSS Art or SVG placeholder) */}
      <motion.div 
        animate={mood === 'celebrating' ? { y: [0, -20, 0] } : { y: 0 }}
        transition={{ repeat: mood === 'celebrating' ? Infinity : 0, duration: 0.5 }}
        className="relative w-32 h-32 md:w-40 md:h-40"
      >
        {/* Simple SVG Mascot: Sparkle the Unicorn/Cat hybrid */}
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
           <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          
          {/* Body */}
          <circle cx="100" cy="120" r="60" fill="url(#bodyGrad)" />
          
          {/* Ears */}
          <path d="M 60 70 L 50 20 L 90 60 Z" fill="#8B5CF6" />
          <path d="M 140 70 L 150 20 L 110 60 Z" fill="#8B5CF6" />

          {/* Horn */}
          <path d="M 90 60 L 100 10 L 110 60 Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" />

          {/* Eyes */}
          {mood === 'thinking' ? (
             <g>
               <circle cx="80" cy="110" r="5" fill="white" />
               <circle cx="120" cy="110" r="5" fill="white" />
             </g>
          ) : (
             <g>
                <circle cx="80" cy="110" r="8" fill="white" />
                <circle cx="80" cy="110" r="3" fill="black" />
                <circle cx="120" cy="110" r="8" fill="white" />
                <circle cx="120" cy="110" r="3" fill="black" />
             </g>
          )}

          {/* Mouth */}
          {mood === 'happy' && <path d="M 90 130 Q 100 140 110 130" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />}
          {mood === 'celebrating' && <circle cx="100" cy="135" r="10" fill="white" />}
          {mood === 'thinking' && <line x1="90" y1="135" x2="110" y2="135" stroke="white" strokeWidth="3" strokeLinecap="round" />}

          {/* Blush */}
          <circle cx="65" cy="125" r="6" fill="#F472B6" opacity="0.6" />
          <circle cx="135" cy="125" r="6" fill="#F472B6" opacity="0.6" />
        </svg>
      </motion.div>
    </div>
  );
};

export default Character;