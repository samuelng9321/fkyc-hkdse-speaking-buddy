import React, { useEffect, useState } from 'react';

interface AvatarProps {
  volume: number; // 0 to 1
  isListening: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ volume, isListening }) => {
  // Map volume to mouth height
  const mouthHeight = Math.max(4, Math.min(30, volume * 150));
  const [blink, setBlink] = useState(false);

  // Random blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 flex items-center justify-center animate-float">
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-indigo-400 rounded-full blur-3xl transition-opacity duration-300 ${volume > 0.05 ? 'opacity-30' : 'opacity-10'}`}></div>

      {/* Main SVG Character */}
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl z-10">
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" /> {/* Indigo-400 */}
            <stop offset="100%" stopColor="#4f46e5" /> {/* Indigo-600 */}
          </linearGradient>
          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0e7ff" /> {/* Indigo-50 */}
            <stop offset="100%" stopColor="#c7d2fe" /> {/* Indigo-200 */}
          </linearGradient>
          <clipPath id="screenClip">
             <rect x="50" y="55" width="100" height="70" rx="15" />
          </clipPath>
        </defs>

        {/* Body Shape (Rounded Rect / Robot Head) */}
        <rect x="35" y="35" width="130" height="110" rx="35" fill="url(#bodyGrad)" stroke="#312e81" strokeWidth="4" />
        
        {/* Antenna */}
        <line x1="100" y1="35" x2="100" y2="15" stroke="#312e81" strokeWidth="4" />
        <circle cx="100" cy="10" r="8" fill={isListening ? "#ef4444" : "#22c55e"} stroke="#312e81" strokeWidth="2" className="transition-colors duration-500" />

        {/* Face Screen Area */}
        <rect x="50" y="55" width="100" height="70" rx="15" fill="#1e1b4b" stroke="#312e81" strokeWidth="3" />

        {/* Eyes (Left & Right) */}
        <g transform={blink ? "scale(1, 0.1) translate(0, 700)" : ""}>
             {/* Left Eye */}
             <circle cx="75" cy="80" r="10" fill="#6366f1" className="animate-pulse" />
             <circle cx="78" cy="77" r="3" fill="white" />
             
             {/* Right Eye */}
             <circle cx="125" cy="80" r="10" fill="#6366f1" className="animate-pulse" />
             <circle cx="128" cy="77" r="3" fill="white" />
        </g>

        {/* Mouth (Dynamic) */}
        <path 
            d={`M 85,105 Q 100,${105 + mouthHeight} 115,105`} 
            stroke="white" 
            strokeWidth="4" 
            fill="transparent" 
            strokeLinecap="round"
            className="transition-all duration-75"
        />

        {/* Headphones / Ears */}
        <rect x="25" y="70" width="15" height="40" rx="5" fill="#312e81" />
        <rect x="160" y="70" width="15" height="40" rx="5" fill="#312e81" />
        <path d="M 40 70 C 40 20, 160 20, 160 70" fill="transparent" stroke="#312e81" strokeWidth="5" />

        {/* Shoulders */}
        <path d="M 50 145 L 50 180 Q 100 200 150 180 L 150 145 Z" fill="#4338ca" stroke="#312e81" strokeWidth="4" />
      </svg>
      
      {/* Speech Bubble / Status Indicator - Hidden on very small screens if interfering, or scaled */}
      <div className={`absolute -top-4 -right-8 bg-white px-3 py-1 md:px-4 md:py-2 rounded-xl shadow-lg border-2 border-indigo-50 transform rotate-6 transition-all duration-300 ${volume > 0.05 ? 'scale-110' : 'scale-100'}`}>
        <span className="text-xs md:text-sm font-bold text-indigo-900">
            {volume > 0.05 ? "Speaking..." : isListening ? "Listening..." : "Ready!"}
        </span>
      </div>
    </div>
  );
};

export default Avatar;