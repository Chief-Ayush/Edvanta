// Test script to verify PWA storage works with real data only
// Run this in browser console to test offline storage functionality

const testOfflineStorage = () => {
  console.log('=== Testing PWA Offline Storage ===');
  
  // Test 1: Check localStorage for any dummy data
  console.log('\n1. Checking for dummy data in localStorage:');
  const offlineKeys = Object.keys(localStorage).filter(key => key.startsWith('offline_'));
  
  if (offlineKeys.length === 0) {
    console.log('✅ No offline data found - This is expected when starting fresh');
  } else {
    offlineKeys.forEach(key => {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`${key}:`, data);
      
      // Check for dummy values
      if (data && typeof data === 'object') {
        const hasDummyData = checkForDummyData(data);
        if (hasDummyData) {
          console.warn(`⚠️ Potential dummy data found in ${key}`);
        } else {
          console.log(`✅ ${key} contains real data or is properly empty`);
        }
      }
    });
  }
  
  // Test 2: Simulate storing real data
  console.log('\n2. Testing storage of real data:');
  const testData = {
    userProfile: {
      uid: 'test123',
      displayName: 'Test User',
      email: 'test@example.com',
      lastSync: new Date().toISOString()
    },
    userStats: {
      totalQuizzesTaken: 5,
      averageScore: 85,
      lastUpdated: new Date().toISOString()
    }
  };
  
  // Store test data
  localStorage.setItem('offline_user_profile', JSON.stringify(testData.userProfile));
  localStorage.setItem('offline_user_stats', JSON.stringify(testData.userStats));
  
  console.log('✅ Test data stored successfully');
  
  // Test 3: Verify data retrieval
  console.log('\n3. Testing data retrieval:');
  const retrievedProfile = JSON.parse(localStorage.getItem('offline_user_profile'));
  const retrievedStats = JSON.parse(localStorage.getItem('offline_user_stats'));
  
  console.log('Retrieved profile:', retrievedProfile);
  console.log('Retrieved stats:', retrievedStats);
  
  // Test 4: Clean up test data
  console.log('\n4. Cleaning up test data:');
  localStorage.removeItem('offline_user_profile');
  localStorage.removeItem('offline_user_stats');
  console.log('✅ Test data cleaned up');
  
  console.log('\n=== PWA Storage Test Complete ===');
};

const checkForDummyData = (obj) => {
  const dummyPatterns = [
    'dummy', 'placeholder', 'test', 'sample',
    'fake', 'mock', 'demo'
  ];
  
  const jsonString = JSON.stringify(obj).toLowerCase();
  return dummyPatterns.some(pattern => jsonString.includes(pattern));
};

// Export for manual testing
window.testOfflineStorage = testOfflineStorage;

console.log('PWA Test utility loaded. Run testOfflineStorage() to test the offline storage system.');