import React from 'react';
import { useOfflineDashboard } from '../../hooks/useOfflineStorage';

const OfflineDashboardContent = ({ className = "" }) => {
  const { data: dashboardData, isAvailable } = useOfflineDashboard();

  if (!isAvailable || !dashboardData) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Cached Dashboard Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sync your data when online to view your dashboard here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cached Dashboard</h2>
      
      {/* Quick Stats */}
      {dashboardData.quickStats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {dashboardData.quickStats.quizzesThisWeek !== undefined && (
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-blue-600">{dashboardData.quickStats.quizzesThisWeek}</div>
              <div className="text-xs text-gray-600">Quizzes This Week</div>
            </div>
          )}
          {dashboardData.quickStats.hoursThisWeek !== undefined && (
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-green-600">{dashboardData.quickStats.hoursThisWeek}h</div>
              <div className="text-xs text-gray-600">Hours This Week</div>
            </div>
          )}
          {dashboardData.quickStats.roadmapsInProgress !== undefined && (
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-purple-600">{dashboardData.quickStats.roadmapsInProgress}</div>
              <div className="text-xs text-gray-600">Active Roadmaps</div>
            </div>
          )}
        </div>
      )}

      {/* Learning Progress */}
      {dashboardData.learningProgress && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Learning Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboardData.learningProgress.currentStreak !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{dashboardData.learningProgress.currentStreak}</div>
                <div className="text-xs text-gray-600">Current Streak</div>
              </div>
            )}
            {dashboardData.learningProgress.weeklyGoal !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{dashboardData.learningProgress.weeklyGoal}</div>
                <div className="text-xs text-gray-600">Weekly Goal</div>
              </div>
            )}
            {dashboardData.learningProgress.weeklyProgress !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{dashboardData.learningProgress.weeklyProgress}</div>
                <div className="text-xs text-gray-600">Weekly Progress</div>
              </div>
            )}
            {dashboardData.learningProgress.totalXP !== undefined && (
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">{dashboardData.learningProgress.totalXP}</div>
                <div className="text-xs text-gray-600">Total XP</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Quizzes */}
      {dashboardData.recentQuizzes && dashboardData.recentQuizzes.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Quizzes</h3>
          <div className="space-y-2">
            {dashboardData.recentQuizzes.slice(0, 3).map((quiz, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{quiz.title}</span>
                {quiz.score !== undefined && (
                  <span className="text-gray-500">{quiz.score}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Roadmaps */}
      {dashboardData.recentRoadmaps && dashboardData.recentRoadmaps.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Roadmaps</h3>
          <div className="space-y-2">
            {dashboardData.recentRoadmaps.slice(0, 3).map((roadmap, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{roadmap.title}</span>
                {roadmap.progress !== undefined && (
                  <span className="text-gray-500">{roadmap.progress}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Tasks */}
      {dashboardData.upcomingTasks && dashboardData.upcomingTasks.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Upcoming Tasks</h3>
          <div className="space-y-2">
            {dashboardData.upcomingTasks.slice(0, 3).map((task, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{task.title}</span>
                {task.dueDate && (
                  <span className="text-orange-600 text-xs">{task.dueDate}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {dashboardData.achievements && dashboardData.achievements.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Achievements</h3>
          <div className="space-y-2">
            {dashboardData.achievements.slice(0, 3).map((achievement, index) => (
              <div key={index} className="flex items-center text-sm">
                <span className="mr-2">🏆</span>
                <span className="text-gray-600">{achievement.title || achievement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Sync Info */}
      {dashboardData.lastSync && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Last synced: {new Date(dashboardData.lastSync).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default OfflineDashboardContent;