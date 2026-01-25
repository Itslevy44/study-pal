
import React from 'react';

const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-48 h-48'
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      {/* Yellow Background Circle */}
      <div className="absolute inset-0 bg-[#FFF3A3] rounded-full shadow-inner" />
      
      {/* Book Icon and Chat Bubble */}
      <div className="relative w-3/4 h-3/4 flex items-center justify-center">
        {/* Simplified SVG Logo representing the User's Image */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Open Book */}
          <path d="M50 85V35C50 35 30 35 15 45V85C30 75 50 75 50 75C50 75 70 75 85 85V45C70 35 50 35 50 35" stroke="#2D3E50" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="white" />
          <path d="M50 85V35" stroke="#2D3E50" strokeWidth="4" />
          <path d="M15 45L15 85" stroke="#F4A261" strokeWidth="6" strokeLinecap="round" />
          <path d="M85 45L85 85" stroke="#F4A261" strokeWidth="6" strokeLinecap="round" />
          
          {/* Chat Bubble with Smile */}
          <circle cx="50" cy="35" r="22" fill="#75C2F6" stroke="#2D3E50" strokeWidth="5" />
          <path d="M40 35C40 33 42 31 44 31C46 31 48 33 48 35" stroke="#2D3E50" strokeWidth="3" strokeLinecap="round" />
          <path d="M52 35C52 33 54 31 56 31C58 31 60 33 60 35" stroke="#2D3E50" strokeWidth="3" strokeLinecap="round" />
          <path d="M44 42C44 42 47 46 50 46C53 46 56 42 56 42" stroke="#2D3E50" strokeWidth="3" strokeLinecap="round" />
          <path d="M40 50L35 55L35 45" fill="#75C2F6" stroke="#2D3E50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

export default Logo;
