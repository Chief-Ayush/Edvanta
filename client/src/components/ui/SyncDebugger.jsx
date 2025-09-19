import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOnlineStatus } from '../../hooks/usePWA';
import backEndURL from '../../hooks/helper';

const SyncDebugger = ({ className = "" }) => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [debugInfo, setDebugInfo] = useState({
    backendUrl: backEndURL,
    userEmail: null,
    isOnline: false,
    lastSyncAttempt: null,
    apiResponses: {},
    localStorage: {}
  });

  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      userEmail: user?.email || null,
      isOnline: isOnline
    }));
  }, [user, isOnline]);

  const testApiEndpoints = async () => {
    if (!user?.email) {
      alert('No user email available');
      return;
    }

    const userEmail = user.email;
    const responses = {};

    try {
      // Test user stats
      try {
        const userStatsResponse = await fetch(`${backEndURL}/api/user-stats?user_email=${encodeURIComponent(userEmail)}`);
        responses.userStats = {
          ok: userStatsResponse.ok,
          status: userStatsResponse.status,
          data: userStatsResponse.ok ? await userStatsResponse.json() : await userStatsResponse.text()
        };
      } catch (error) {
        responses.userStats = { error: error.message };
      }

      // Test roadmaps
      try {
        const roadmapsResponse = await fetch(`${backEndURL}/api/roadmap/user?user_email=${encodeURIComponent(userEmail)}`);
        responses.roadmaps = {
          ok: roadmapsResponse.ok,
          status: roadmapsResponse.status,
          data: roadmapsResponse.ok ? await roadmapsResponse.json() : await roadmapsResponse.text()
        };
      } catch (error) {
        responses.roadmaps = { error: error.message };
      }

      // Test quiz history
      try {
        const quizHistoryResponse = await fetch(`${backEndURL}/api/quiz-history?user_email=${encodeURIComponent(userEmail)}`);
        responses.quizHistory = {
          ok: quizHistoryResponse.ok,
          status: quizHistoryResponse.status,
          data: quizHistoryResponse.ok ? await quizHistoryResponse.json() : await quizHistoryResponse.text()
        };
      } catch (error) {
        responses.quizHistory = { error: error.message };
      }

      setDebugInfo(prev => ({
        ...prev,
        lastSyncAttempt: new Date().toISOString(),
        apiResponses: responses
      }));

    } catch (error) {
      console.error('API test failed:', error);
    }
  };

  const checkLocalStorage = () => {
    const offlineKeys = ['offline_user_profile', 'offline_user_stats', 'offline_dashboard_data', 'offline_quizzes'];
    const localStorageData = {};

    offlineKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          localStorageData[key] = JSON.parse(data);
        } catch (e) {
          localStorageData[key] = { error: 'Invalid JSON' };
        }
      } else {
        localStorageData[key] = null;
      }
    });

    setDebugInfo(prev => ({
      ...prev,
      localStorage: localStorageData
    }));
  };

  useEffect(() => {
    checkLocalStorage();
  }, []);

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔧 Sync Debugger</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Environment Info</h4>
          <div className="text-sm space-y-1">
            <div><strong>Backend URL:</strong> {debugInfo.backendUrl || 'Not configured'}</div>
            <div><strong>User Email:</strong> {debugInfo.userEmail || 'Not logged in'}</div>
            <div><strong>Online Status:</strong> <span className={debugInfo.isOnline ? 'text-green-600' : 'text-red-600'}>{debugInfo.isOnline ? 'Online' : 'Offline'}</span></div>
            <div><strong>Last Test:</strong> {debugInfo.lastSyncAttempt ? new Date(debugInfo.lastSyncAttempt).toLocaleString() : 'Never'}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">LocalStorage Status</h4>
          <div className="text-sm space-y-1">
            {Object.entries(debugInfo.localStorage).map(([key, value]) => (
              <div key={key}>
                <strong>{key.replace('offline_', '')}:</strong> 
                <span className={value ? 'text-green-600' : 'text-gray-500'}>
                  {value ? ' ✓ Has data' : ' ✗ No data'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={testApiEndpoints}
          disabled={!isOnline || !user?.email}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-400"
        >
          Test API Endpoints
        </button>
        <button
          onClick={checkLocalStorage}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Refresh Storage Status
        </button>
      </div>

      {debugInfo.apiResponses && Object.keys(debugInfo.apiResponses).length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">API Test Results</h4>
          <div className="space-y-2">
            {Object.entries(debugInfo.apiResponses).map(([endpoint, response]) => (
              <div key={endpoint} className="bg-white p-2 rounded border">
                <div className="font-medium text-sm">{endpoint}</div>
                {response.error ? (
                  <div className="text-red-600 text-xs">Error: {response.error}</div>
                ) : (
                  <div>
                    <div className={`text-xs ${response.ok ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {response.status} {response.ok ? '✓' : '✗'}
                    </div>
                    {response.data && (
                      <details className="text-xs text-gray-600 mt-1">
                        <summary className="cursor-pointer">Show data</summary>
                        <pre className="mt-1 text-xs overflow-auto max-h-32">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncDebugger;