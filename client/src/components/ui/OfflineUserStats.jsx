import React from 'react';
import { useOfflineUserStats } from '../../hooks/useOfflineStorage';

const OfflineUserStats = ({ className = "" }) => {
  const { data: userStats, isAvailable } = useOfflineUserStats();

  if (!isAvailable || !userStats) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Cached Stats Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sync your data when online to view your statistics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cached Statistics</h2>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {userStats.totalQuizzesTaken !== undefined && (
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{userStats.totalQuizzesTaken}</div>
            <div className="text-sm text-gray-600">Quizzes Taken</div>
          </div>
        )}
        
        {userStats.averageScore !== undefined && (
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{userStats.averageScore}%</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
        )}
        
        {userStats.totalHoursLearned !== undefined && (
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{userStats.totalHoursLearned}h</div>
            <div className="text-sm text-gray-600">Hours Learned</div>
          </div>
        )}
        
        {userStats.streakDays !== undefined && (
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{userStats.streakDays}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
        )}
      </div>

      {/* Weekly Progress */}
      {userStats.weeklyProgress && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">This Week's Progress</h3>
          <div className="grid grid-cols-3 gap-4">
            {userStats.weeklyProgress.quizzesThisWeek !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{userStats.weeklyProgress.quizzesThisWeek}</div>
                <div className="text-xs text-gray-600">Quizzes</div>
              </div>
            )}
            {userStats.weeklyProgress.hoursThisWeek !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{userStats.weeklyProgress.hoursThisWeek}h</div>
                <div className="text-xs text-gray-600">Hours</div>
              </div>
            )}
            {userStats.weeklyProgress.currentStreak !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">{userStats.weeklyProgress.currentStreak}</div>
                <div className="text-xs text-gray-600">Streak</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strong & Weak Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {userStats.strongSubjects && userStats.strongSubjects.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <svg className="h-4 w-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Strong Subjects
            </h3>
            <div className="space-y-1">
              {userStats.strongSubjects.slice(0, 3).map((subject, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{subject.name || subject}</span>
                  {subject.score !== undefined && (
                    <span className="text-green-600 font-medium">{subject.score}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {userStats.weakSubjects && userStats.weakSubjects.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <svg className="h-4 w-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Areas for Improvement
            </h3>
            <div className="space-y-1">
              {userStats.weakSubjects.slice(0, 3).map((subject, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{subject.name || subject}</span>
                  {subject.score !== undefined && (
                    <span className="text-red-600 font-medium">{subject.score}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {userStats.recentActivity && userStats.recentActivity.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {userStats.recentActivity.slice(0, 3).map((activity, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <span className="mr-2">
                    {activity.type === 'quiz' ? '📝' : activity.type === 'roadmap' ? '🗺️' : '📚'}
                  </span>
                  {activity.subject || activity.title}
                </span>
                <span className="text-gray-500">
                  {activity.score !== undefined ? `${activity.score}%` : 'Completed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {userStats.lastUpdated && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Last updated: {new Date(userStats.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default OfflineUserStats;