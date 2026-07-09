import React from 'react';

interface SportIconProps {
  sportName: string;
  className?: string;
}

export const SportIcon: React.FC<SportIconProps> = ({ sportName, className = "w-6 h-6" }) => {
  const name = sportName.toLowerCase().trim();

  switch (name) {
    case 'futbol':
    case 'football':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      );

    case 'basketbol':
    case 'basketball':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M6.2 6.2c2.4 2.4 2.4 6.4 0 8.8M17.8 6.2c-2.4 2.4-2.4 6.4 0 8.8" />
          <path d="M2 12h20M12 2v20" />
        </svg>
      );

    case 'tennis':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M11.5 7.5a4.5 4.5 0 0 0-4 4M12.5 16.5a4.5 4.5 0 0 0 4-4" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      );

    case 'voleybol':
    case 'volleyball':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 0-6.4 17.7M12 2a10 10 0 0 1 6.4 17.7" />
          <path d="M2.5 14h19M12 2v20" />
        </svg>
      );

    case 'stol tennisi':
    case 'ping pong':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="5" />
          <path d="M13.5 13.5L19 19M17 21l2-2-4-4-2 2 4 4z" />
          <circle cx="18" cy="6" r="1" fill="currentColor" />
        </svg>
      );

    case 'bilyard':
    case 'billiards':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="M19 5L5 19" strokeWidth="1.5" />
        </svg>
      );

    default:
      // Agar sport turi topilmasa, standart to'p ikonkasini qaytaradi
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};