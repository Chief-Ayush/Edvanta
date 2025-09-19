import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/usePWA';
import { useOfflineSync } from '../hooks/useOfflineSync';
import OfflineUserProfile from '../components/ui/OfflineUserProfile';
import OfflineUserStats from '../components/ui/OfflineUserStats';
import OfflineDashboardContent from '../components/ui/OfflineDashboardContent';
import OfflineQuizzesViewer from '../components/ui/OfflineQuizzesViewer';
import SyncDebugger from '../components/ui/SyncDebugger';
import LocalStorageInspector from '../components/ui/LocalStorageInspector';
import backEndURL from '../hooks/helper';

const OfflineDashboard = () => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const { getSyncStatus, syncAllData } = useOfflineSync();
  const [activeTab, setActiveTab] = useState('profile');
  const [syncStatus, setSyncStatus] = useState(null);

  // Function to refresh sync status without causing re-renders
  const refreshSyncStatus = () => {
    const status = getSyncStatus();
    setSyncStatus(status);
  };

  useEffect(() => {
    // Only update sync status on component mount
    refreshSyncStatus();
    console.log('OfflineDashboard mounted');
  }, []); // Empty dependency array - only run on mount

  // Separate effect for activeTab changes if needed
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);

  const handleSyncData = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline. Please check your internet connection.');
      return;
    }

    try {
      const userEmail = user?.email;
      if (!userEmail) {
        alert('User email not available for sync');
        return;
      }

      console.log('🔄 Starting data sync for user:', userEmail);
      console.log('🌐 Backend URL:', backEndURL);
      
      // Fetch user stats from API
      console.log('📊 Fetching user stats...');
      const userStatsResponse = await fetch(`${backEndURL}/api/user-stats?user_email=${encodeURIComponent(userEmail)}`);
      console.log('📊 User stats response status:', userStatsResponse.status);
      const userStatsData = userStatsResponse.ok ? await userStatsResponse.json() : null;
      console.log('📊 User stats data received:', userStatsData);

      // Fetch roadmaps data from API
      console.log('🗺️ Fetching roadmaps...');
      const roadmapsResponse = await fetch(`${backEndURL}/api/roadmap/user?user_email=${encodeURIComponent(userEmail)}`);
      console.log('🗺️ Roadmaps response status:', roadmapsResponse.status);
      const roadmapsData = roadmapsResponse.ok ? await roadmapsResponse.json() : [];
      console.log('🗺️ Roadmaps data received:', roadmapsData);

      // Fetch quiz history from API
      console.log('📝 Fetching quiz history...');
      const quizHistoryResponse = await fetch(`${backEndURL}/api/quiz-history?user_email=${encodeURIComponent(userEmail)}`);
      console.log('📝 Quiz history response status:', quizHistoryResponse.status);
      const quizHistoryData = quizHistoryResponse.ok ? await quizHistoryResponse.json() : [];
      console.log('📝 Quiz history data received:', quizHistoryData);

      // Check if we have any real data
      const hasUserStats = userStatsData && Object.keys(userStatsData).length > 0;
      const hasRoadmaps = roadmapsData && roadmapsData.length > 0;
      const hasQuizHistory = quizHistoryData && quizHistoryData.length > 0;
      
      console.log('📋 Data availability check:');
      console.log('  - User stats:', hasUserStats);
      console.log('  - Roadmaps:', hasRoadmaps);
      console.log('  - Quiz history:', hasQuizHistory);

      if (!hasUserStats && !hasRoadmaps && !hasQuizHistory) {
        alert('No data found for your account. Try using the app first to generate some statistics.');
        return;
      }

      // Prepare data for offline storage - ONLY store actual data, no fallbacks
      const onlineData = {
        userProfile: {
          uid: user?.uid,
          displayName: user?.displayName,
          email: user?.email,
          photoURL: user?.photoURL,
          emailVerified: user?.emailVerified,
          lastSync: new Date().toISOString()
        },
        userStats: null,
        dashboardData: null,
        quizzesData: null
      };

      // Process user stats only if we have real data
      if (hasUserStats) {
        console.log('🔄 Processing user stats...');
        const processedStats = {};
        
        // Only store properties that have actual values from API
        if (userStatsData.quizzes_taken !== undefined && userStatsData.quizzes_taken !== null) {
          processedStats.totalQuizzesTaken = userStatsData.quizzes_taken;
          console.log('  ✅ Stored totalQuizzesTaken:', processedStats.totalQuizzesTaken);
        }
        
        if (userStatsData.total_learning_minutes !== undefined && userStatsData.total_learning_minutes !== null) {
          processedStats.totalHoursLearned = Math.round(userStatsData.total_learning_minutes / 60);
          console.log('  ✅ Stored totalHoursLearned:', processedStats.totalHoursLearned);
        }
        
        if (userStatsData.active_roadmaps !== undefined && userStatsData.active_roadmaps !== null) {
          processedStats.completedRoadmaps = userStatsData.active_roadmaps;
          console.log('  ✅ Stored completedRoadmaps:', processedStats.completedRoadmaps);
        }
        
        if (userStatsData.skills_learning !== undefined && userStatsData.skills_learning !== null) {
          processedStats.skillsLearning = userStatsData.skills_learning;
          console.log('  ✅ Stored skillsLearning:', processedStats.skillsLearning);
        }
        
        // Calculate average score from quiz history if available
        if (hasQuizHistory) {
          const validScores = quizHistoryData.filter(quiz => quiz.percentage !== undefined && quiz.percentage !== null);
          if (validScores.length > 0) {
            processedStats.averageScore = Math.round(
              validScores.reduce((sum, quiz) => sum + quiz.percentage, 0) / validScores.length
            );
            console.log('  ✅ Calculated averageScore:', processedStats.averageScore);
          }
        }
        
        // Weekly progress from actual data
        if (userStatsData.quizzes_taken !== undefined || userStatsData.total_learning_minutes !== undefined) {
          processedStats.weeklyProgress = {};
          if (userStatsData.quizzes_taken !== undefined) {
            processedStats.weeklyProgress.quizzesThisWeek = userStatsData.quizzes_taken;
          }
          if (userStatsData.total_learning_minutes !== undefined) {
            processedStats.weeklyProgress.hoursThisWeek = Math.round(userStatsData.total_learning_minutes / 60);
          }
          console.log('  ✅ Stored weeklyProgress:', processedStats.weeklyProgress);
        }
        
        // Recent activity from quiz history
        if (hasQuizHistory) {
          processedStats.recentActivity = quizHistoryData.slice(0, 5).map(quiz => ({
            type: 'quiz',
            subject: quiz.subject || quiz.topic || 'General',
            score: quiz.percentage || quiz.score,
            date: quiz.completedAt || quiz.date_taken || new Date().toISOString()
          }));
          console.log('  ✅ Stored recentActivity:', processedStats.recentActivity.length, 'items');
        }
        
        processedStats.lastUpdated = new Date().toISOString();
        onlineData.userStats = processedStats;
        console.log('📊 Final processed user stats:', processedStats);
      }
      
      // Process dashboard data
      if (hasRoadmaps || hasQuizHistory) {
        console.log('🔄 Processing dashboard data...');
        const dashboardData = {};
        
        if (hasQuizHistory) {
          dashboardData.recentQuizzes = quizHistoryData.slice(0, 5).map(quiz => ({
            id: quiz._id || quiz.id,
            title: quiz.title || quiz.topic,
            subject: quiz.subject || quiz.topic || 'General',
            score: quiz.percentage || quiz.score,
            date: quiz.completedAt || quiz.date_taken || new Date().toISOString()
          }));
          console.log('  ✅ Stored recentQuizzes:', dashboardData.recentQuizzes.length, 'items');
        }
        
        if (hasRoadmaps) {
          dashboardData.recentRoadmaps = roadmapsData.slice(0, 5).map(roadmap => ({
            id: roadmap._id || roadmap.id,
            title: roadmap.title || roadmap.goal,
            progress: roadmap.progress || 0,
            estimatedCompletion: roadmap.estimated_completion || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }));
          console.log('  ✅ Stored recentRoadmaps:', dashboardData.recentRoadmaps.length, 'items');
        }
        
        if (hasUserStats) {
          dashboardData.quickStats = {};
          if (userStatsData.quizzes_taken !== undefined) {
            dashboardData.quickStats.quizzesThisWeek = userStatsData.quizzes_taken;
          }
          if (userStatsData.total_learning_minutes !== undefined) {
            dashboardData.quickStats.hoursThisWeek = Math.round(userStatsData.total_learning_minutes / 60);
          }
          if (userStatsData.active_roadmaps !== undefined) {
            dashboardData.quickStats.roadmapsInProgress = userStatsData.active_roadmaps;
          }
          console.log('  ✅ Stored quickStats:', dashboardData.quickStats);
        }
        
        onlineData.dashboardData = dashboardData;
        console.log('📋 Final processed dashboard data:', dashboardData);
      }
      
      // Process quizzes data
      if (hasQuizHistory) {
        console.log('🔄 Processing quizzes data...');
        const quizzesData = {
          quizzes: quizHistoryData.map(quiz => ({
            id: quiz._id || quiz.id,
            title: quiz.title || quiz.topic,
            subject: quiz.subject || quiz.topic || 'General',
            difficulty: quiz.difficulty || 'Medium',
            duration: quiz.duration || quiz.timeSpent || 30,
            totalQuestions: quiz.totalQuestions || (quiz.questions ? quiz.questions.length : 10),
            createdAt: quiz.createdAt || quiz.date_taken || new Date().toISOString(),
            completedAt: quiz.completedAt || quiz.date_taken || new Date().toISOString(),
            score: quiz.percentage || quiz.score,
            questions: quiz.questions || []
          })),
          totalCount: quizHistoryData.length
        };
        onlineData.quizzesData = quizzesData;
        console.log('📝 Final processed quizzes data:', quizzesData.totalCount, 'quizzes');
      }

      console.log('💾 Final data to sync:', onlineData);

      const success = await syncAllData(onlineData);
      console.log('🔄 Sync result:', success);
      
      if (success) {
        refreshSyncStatus();
        alert(`Data synced successfully! Cached ${hasUserStats ? 'stats, ' : ''}${hasRoadmaps ? 'roadmaps, ' : ''}${hasQuizHistory ? 'quiz history' : ''}.`);
      } else {
        alert('Some data failed to sync. Please check the console for details and try again.');
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      alert(`Sync failed: ${error.message}. Please check your internet connection and try again.`);
    }
  };

  const TabButton = ({ tabId, label, count }) => (
    <button
      onClick={() => {
        console.log('Tab clicked:', tabId); // Debug log
        setActiveTab(tabId);
      }}
      className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
        activeTab === tabId
          ? 'bg-blue-500 text-white shadow-md'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      type="button"
    >
      {label}
      {count !== undefined && (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white bg-opacity-20">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Offline Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Access your cached data even without internet connection
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online Status */}
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              
              {/* Sync Button */}
              {isOnline && (
                <button
                  onClick={handleSyncData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Data</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Sync Status */}
          {syncStatus && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Data Sync Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className={`p-2 rounded ${syncStatus.userProfile.hasData ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`font-medium ${syncStatus.userProfile.hasData ? 'text-green-800' : 'text-gray-600'}`}>
                    Profile
                  </div>
                  <div className="text-gray-500">
                    {syncStatus.userProfile.hasData ? '✓ Available' : '✗ No data'}
                  </div>
                  {syncStatus.userProfile.hasData && syncStatus.userProfile.data?.lastSync && (
                    <div className="text-gray-400 text-xs mt-1">
                      Last sync: {new Date(syncStatus.userProfile.data.lastSync).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded ${syncStatus.userStats.hasData ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`font-medium ${syncStatus.userStats.hasData ? 'text-green-800' : 'text-gray-600'}`}>
                    Stats
                  </div>
                  <div className="text-gray-500">
                    {syncStatus.userStats.hasData ? '✓ Available' : '✗ No data'}
                  </div>
                  {syncStatus.userStats.hasData && (
                    <div className="text-gray-400 text-xs mt-1">
                      {syncStatus.userStats.data?.totalQuizzesTaken || 0} quizzes
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded ${syncStatus.dashboardData.hasData ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`font-medium ${syncStatus.dashboardData.hasData ? 'text-green-800' : 'text-gray-600'}`}>
                    Dashboard
                  </div>
                  <div className="text-gray-500">
                    {syncStatus.dashboardData.hasData ? '✓ Available' : '✗ No data'}
                  </div>
                  {syncStatus.dashboardData.hasData && (
                    <div className="text-gray-400 text-xs mt-1">
                      {syncStatus.dashboardData.data?.recentQuizzes?.length || 0} recent items
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded ${syncStatus.quizzesData.hasData ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`font-medium ${syncStatus.quizzesData.hasData ? 'text-green-800' : 'text-gray-600'}`}>
                    Quizzes
                  </div>
                  <div className="text-gray-500">
                    {syncStatus.quizzesData.hasData ? '✓ Available' : '✗ No data'}
                  </div>
                  {syncStatus.quizzesData.hasData && (
                    <div className="text-gray-400 text-xs mt-1">
                      {syncStatus.quizzesData.data?.totalCount || 0} total
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Component - Remove this after testing */}
        <SyncDebugger className="mb-6" />

        {/* LocalStorage Inspector - Remove this after testing */}
        <LocalStorageInspector className="mb-6" />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton tabId="profile" label="Profile" />
          <TabButton tabId="stats" label="Statistics" />
          <TabButton tabId="dashboard" label="Dashboard" />
          <TabButton 
            tabId="quizzes" 
            label="Recent Quizzes" 
            count={syncStatus?.quizzesData?.hasData ? 
              (syncStatus.quizzesData.data?.quizzes?.length || 0) : 
              0
            } 
          />
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm min-h-[400px]">
          {activeTab === 'profile' && (
            <OfflineUserProfile />
          )}
          
          {activeTab === 'stats' && (
            <OfflineUserStats />
          )}
          
          {activeTab === 'dashboard' && (
            <OfflineDashboardContent />
          )}
          
          {activeTab === 'quizzes' && (
            <OfflineQuizzesViewer />
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineDashboard;