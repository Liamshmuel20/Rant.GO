import React from 'react';

export default function Logo({ size = 'medium', showText = true, className = '' }) {
  const sizes = {
    small: { container: 'w-10 h-10', text: 'text-sm', logoSize: 24 },
    medium: { container: 'w-14 h-14', text: 'text-xl', logoSize: 32 },
    large: { container: 'w-18 h-18', text: 'text-2xl', logoSize: 40 },
    xl: { container: 'w-24 h-24', text: 'text-3xl', logoSize: 48 }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Modern Logo Design */}
      <div className={`${currentSize.container} relative`}>
        {/* Outer Circle with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-full shadow-lg"></div>
        
        {/* Inner Design */}
        <div className="relative w-full h-full flex items-center justify-center">
          <svg 
            width={currentSize.logoSize} 
            height={currentSize.logoSize} 
            viewBox="0 0 48 48" 
            fill="none"
            className="drop-shadow-sm"
          >
            {/* Background Circle */}
            <circle cx="24" cy="24" r="20" fill="white" fillOpacity="0.15"/>
            
            {/* Letter R - Modern Design */}
            <path 
              d="M12 12h12c3.3 0 6 2.7 6 6 0 2.2-1.2 4.1-3 5.2L32 36h-4.5l-4.5-11h-5v11H12V12z M18 17v8h6c1.7 0 3-1.3 3-3s-1.3-3-3-3h-6z" 
              fill="white"
              className="drop-shadow-sm"
            />
            
            {/* Decorative Arrow/Movement Element */}
            <path 
              d="M34 20l4 4-4 4m2-4h-8" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
            
            {/* Small Accent Dots */}
            <circle cx="20" cy="32" r="1.5" fill="white" fillOpacity="0.7"/>
            <circle cx="38" cy="16" r="1" fill="white" fillOpacity="0.5"/>
          </svg>
        </div>
        
        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full blur-md opacity-30 -z-10 scale-110"></div>
      </div>

      {/* App Name with Modern Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-black ${currentSize.text} leading-none`}>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Rant
            </span>
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              .GO
            </span>
          </div>
          <span className="text-xs text-orange-600 font-semibold tracking-wide mt-1">
            השכרה חכמה
          </span>
        </div>
      )}
    </div>
  );
}