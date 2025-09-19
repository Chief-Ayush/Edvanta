import { useState, useEffect, useCallback } from 'react';

// Storage utility functions
const getStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return null;
  }
};

const setStorageItem = (key, value) => {
  try {
    console.log(`📝 Writing to localStorage[${key}]:`, value);
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`✅ Successfully wrote to localStorage[${key}]`);
    return true;
  } catch (error) {
    console.error(`❌ Error writing to localStorage[${key}]:`, error);
    return false;
  }
};

const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error);
    return false;
  }
};

// Generic offline storage hook - returns null if no data exists
export const useOfflineStorage = (key, defaultValue = null) => {
  const [data, setData] = useState(() => getStorageItem(key));

  const saveOffline = useCallback((value) => {
    console.log(`💾 Attempting to save to ${key}:`, value);
    if (setStorageItem(key, value)) {
      setData(value);
      console.log(`✅ Successfully saved to ${key}`);
      return true;
    }
    console.log(`❌ Failed to save to ${key}`);
    return false;
  }, [key]);

  const clearOffline = useCallback(() => {
    if (removeStorageItem(key)) {
      setData(null);
      return true;
    }
    return false;
  }, [key]);

  const updateOffline = useCallback((updater) => {
    const currentData = getStorageItem(key);
    if (currentData === null) return false; // Don't update if no data exists
    
    const newData = typeof updater === 'function' ? updater(currentData) : updater;
    return saveOffline(newData);
  }, [key, saveOffline]);

  return {
    data,
    saveOffline,
    clearOffline,
    updateOffline,
    isAvailable: data !== null
  };
};

// User profile offline storage - no dummy data
export const useOfflineUserProfile = () => {
  return useOfflineStorage('offline_user_profile');
};

// User stats offline storage - no dummy data
export const useOfflineUserStats = () => {
  return useOfflineStorage('offline_user_stats');
};

// Dashboard data offline storage - no dummy data
export const useOfflineDashboard = () => {
  return useOfflineStorage('offline_dashboard_data');
};

// Quizzes offline storage - no dummy data
export const useOfflineQuizzes = () => {
  return useOfflineStorage('offline_quizzes');
};

// Storage info and management
export const useStorageInfo = () => {
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    percentage: 0
  });

  const calculateStorageUsage = useCallback(() => {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('offline_')) {
          totalSize += localStorage[key].length;
        }
      }
      
      // Convert to MB
      const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
      const availableMB = 10; // Assume 10MB quota for localStorage
      const percentage = Math.round((usedMB / availableMB) * 100);
      
      setStorageInfo({
        used: parseFloat(usedMB),
        available: availableMB,
        percentage: Math.min(percentage, 100)
      });
    } catch (error) {
      console.error('Error calculating storage usage:', error);
    }
  }, []);

  const clearAllOfflineData = useCallback(() => {
    try {
      const keysToRemove = [];
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('offline_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      calculateStorageUsage();
      return true;
    } catch (error) {
      console.error('Error clearing offline data:', error);
      return false;
    }
  }, [calculateStorageUsage]);

  useEffect(() => {
    calculateStorageUsage();
  }, [calculateStorageUsage]);

  return {
    storageInfo,
    calculateStorageUsage,
    clearAllOfflineData
  };
};