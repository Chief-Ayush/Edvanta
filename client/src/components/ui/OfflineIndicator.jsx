import React from 'react';
import { useOnlineStatus } from '../../hooks/usePWA';

const OfflineIndicator = ({ className = "" }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50 ${className}`}>
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">
          You're offline. Viewing cached data.
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;