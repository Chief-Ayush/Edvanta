// Test the sync functionality for PWA offline storage
// This file can be imported in browser console to test the sync

const testSyncFunctionality = async () => {
  console.log('=== Testing PWA Sync Functionality ===');
  
  try {
    // Get backend URL from environment
    const backEndURL = import.meta.env.VITE_API_BASE_URL;
    console.log('Backend URL:', backEndURL);
    
    if (!backEndURL) {
      console.error('❌ Backend URL not configured');
      return;
    }
    
    // Test user email (replace with actual user email when testing)
    const testUserEmail = 'test@example.com';
    
    console.log('\n1. Testing User Stats API...');
    try {
      const userStatsResponse = await fetch(`${backEndURL}/api/user-stats?user_email=${encodeURIComponent(testUserEmail)}`);
      const userStatsData = userStatsResponse.ok ? await userStatsResponse.json() : null;
      console.log('✅ User Stats:', userStatsData);
    } catch (error) {
      console.error('❌ User Stats API error:', error);
    }
    
    console.log('\n2. Testing Roadmaps API...');
    try {
      const roadmapsResponse = await fetch(`${backEndURL}/api/roadmap/user?user_email=${encodeURIComponent(testUserEmail)}`);
      const roadmapsData = roadmapsResponse.ok ? await roadmapsResponse.json() : [];
      console.log('✅ Roadmaps:', roadmapsData);
    } catch (error) {
      console.error('❌ Roadmaps API error:', error);
    }
    
    console.log('\n3. Testing Quiz History API...');
    try {
      const quizHistoryResponse = await fetch(`${backEndURL}/api/quiz-history?user_email=${encodeURIComponent(testUserEmail)}`);
      const quizHistoryData = quizHistoryResponse.ok ? await quizHistoryResponse.json() : [];
      console.log('✅ Quiz History:', quizHistoryData);
    } catch (error) {
      console.error('❌ Quiz History API error:', error);
    }
    
    console.log('\n4. Testing localStorage current state...');
    const offlineKeys = ['offline_user_profile', 'offline_user_stats', 'offline_dashboard_data', 'offline_quizzes'];
    offlineKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ ${key}:`, parsed);
        } catch (e) {
          console.log(`❌ ${key}: Invalid JSON`);
        }
      } else {
        console.log(`ℹ️ ${key}: No data stored`);
      }
    });
    
    console.log('\n=== Sync Test Complete ===');
    console.log('To test with real data:');
    console.log('1. Go to /offline-dashboard');
    console.log('2. Click "Sync Data" button');
    console.log('3. Check console logs and localStorage');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for console usage
window.testSyncFunctionality = testSyncFunctionality;

console.log('Sync test utility loaded. Run testSyncFunctionality() to test the sync system.');