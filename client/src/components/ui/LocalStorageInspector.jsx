import React, { useState, useEffect } from 'react';

const LocalStorageInspector = ({ className = "" }) => {
  const [storageData, setStorageData] = useState({});

  const refreshStorageData = () => {
    const offlineKeys = ['offline_user_profile', 'offline_user_stats', 'offline_dashboard_data', 'offline_quizzes'];
    const data = {};

    offlineKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          data[key] = { error: 'Invalid JSON', raw: value };
        }
      } else {
        data[key] = null;
      }
    });

    setStorageData(data);
  };

  const clearAllOfflineData = () => {
    const offlineKeys = ['offline_user_profile', 'offline_user_stats', 'offline_dashboard_data', 'offline_quizzes'];
    offlineKeys.forEach(key => localStorage.removeItem(key));
    refreshStorageData();
    alert('All offline data cleared!');
  };

  useEffect(() => {
    refreshStorageData();
  }, []);

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🔍 LocalStorage Inspector</h3>
        <div className="space-x-2">
          <button
            onClick={refreshStorageData}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
          <button
            onClick={clearAllOfflineData}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(storageData).map(([key, value]) => (
          <div key={key} className="bg-white p-3 rounded border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{key.replace('offline_', '')}</h4>
              <span className={`px-2 py-1 text-xs rounded ${
                value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {value ? `${JSON.stringify(value).length} chars` : 'No data'}
              </span>
            </div>
            
            {value ? (
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                  Show data
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </details>
            ) : (
              <p className="text-sm text-gray-500">No data stored</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocalStorageInspector;