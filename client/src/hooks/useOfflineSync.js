import { useCallback, useRef } from 'react';
import { useOnlineStatus } from './usePWA';
import { 
  useOfflineUserProfile, 
  useOfflineUserStats, 
  useOfflineDashboard,
  useOfflineQuizzes
} from './useOfflineStorage';

export const useOfflineSync = () => {
  const isOnline = useOnlineStatus();
  const syncInProgress = useRef(false);

  const userProfile = useOfflineUserProfile();
  const userStats = useOfflineUserStats();
  const dashboardData = useOfflineDashboard();
  const quizzesData = useOfflineQuizzes();

  // Sync user profile data
  const syncUserProfile = useCallback(async (onlineUserData) => {
    if (!isOnline || !onlineUserData) return false;

    try {
      const profileData = {
        lastSync: new Date().toISOString()
      };

      // Only store actual profile data, no fallbacks
      if (onlineUserData.uid) profileData.uid = onlineUserData.uid;
      if (onlineUserData.displayName) profileData.displayName = onlineUserData.displayName;
      if (onlineUserData.email) profileData.email = onlineUserData.email;
      if (onlineUserData.photoURL) profileData.photoURL = onlineUserData.photoURL;
      if (onlineUserData.emailVerified !== undefined) profileData.emailVerified = onlineUserData.emailVerified;
      if (onlineUserData.interests && onlineUserData.interests.length > 0) {
        profileData.interests = onlineUserData.interests;
      }
      if (onlineUserData.preferences) profileData.preferences = onlineUserData.preferences;

      return userProfile.saveOffline(profileData);
    } catch (error) {
      console.error('Error syncing user profile:', error);
      return false;
    }
  }, [isOnline, userProfile]);

  // Sync user stats data
  const syncUserStats = useCallback(async (onlineStatsData) => {
    console.log('🔄 syncUserStats called with:', onlineStatsData);
    
    if (!isOnline || !onlineStatsData) {
      console.log('❌ syncUserStats: No online connection or no data provided');
      return false;
    }

    try {
      // Only store actual data, no fallbacks to 0 or empty arrays
      const statsData = {
        lastUpdated: new Date().toISOString()
      };

      console.log('🔄 Processing stats data...');

      // Only add properties that have actual values
      if (onlineStatsData.totalQuizzesTaken !== undefined && onlineStatsData.totalQuizzesTaken !== null) {
        statsData.totalQuizzesTaken = onlineStatsData.totalQuizzesTaken;
        console.log('  ✅ Added totalQuizzesTaken:', statsData.totalQuizzesTaken);
      }
      if (onlineStatsData.averageScore !== undefined && onlineStatsData.averageScore !== null) {
        statsData.averageScore = onlineStatsData.averageScore;
        console.log('  ✅ Added averageScore:', statsData.averageScore);
      }
      if (onlineStatsData.streakDays !== undefined && onlineStatsData.streakDays !== null) {
        statsData.streakDays = onlineStatsData.streakDays;
        console.log('  ✅ Added streakDays:', statsData.streakDays);
      }
      if (onlineStatsData.totalHoursLearned !== undefined && onlineStatsData.totalHoursLearned !== null) {
        statsData.totalHoursLearned = onlineStatsData.totalHoursLearned;
        console.log('  ✅ Added totalHoursLearned:', statsData.totalHoursLearned);
      }
      if (onlineStatsData.completedRoadmaps !== undefined && onlineStatsData.completedRoadmaps !== null) {
        statsData.completedRoadmaps = onlineStatsData.completedRoadmaps;
        console.log('  ✅ Added completedRoadmaps:', statsData.completedRoadmaps);
      }
      if (onlineStatsData.strongSubjects && onlineStatsData.strongSubjects.length > 0) {
        statsData.strongSubjects = onlineStatsData.strongSubjects;
        console.log('  ✅ Added strongSubjects:', statsData.strongSubjects);
      }
      if (onlineStatsData.weakSubjects && onlineStatsData.weakSubjects.length > 0) {
        statsData.weakSubjects = onlineStatsData.weakSubjects;
        console.log('  ✅ Added weakSubjects:', statsData.weakSubjects);
      }
      if (onlineStatsData.weeklyProgress) {
        const weeklyProgress = {};
        if (onlineStatsData.weeklyProgress.quizzesThisWeek !== undefined) {
          weeklyProgress.quizzesThisWeek = onlineStatsData.weeklyProgress.quizzesThisWeek;
        }
        if (onlineStatsData.weeklyProgress.hoursThisWeek !== undefined) {
          weeklyProgress.hoursThisWeek = onlineStatsData.weeklyProgress.hoursThisWeek;
        }
        if (onlineStatsData.weeklyProgress.currentStreak !== undefined) {
          weeklyProgress.currentStreak = onlineStatsData.weeklyProgress.currentStreak;
        }
        if (Object.keys(weeklyProgress).length > 0) {
          statsData.weeklyProgress = weeklyProgress;
          console.log('  ✅ Added weeklyProgress:', statsData.weeklyProgress);
        }
      }
      if (onlineStatsData.recentActivity && onlineStatsData.recentActivity.length > 0) {
        statsData.recentActivity = onlineStatsData.recentActivity;
        console.log('  ✅ Added recentActivity:', statsData.recentActivity.length, 'items');
      }

      console.log('📊 Final stats data to save:', statsData);
      const result = userStats.saveOffline(statsData);
      console.log('📊 Save result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error syncing user stats:', error);
      return false;
    }
  }, [isOnline, userStats]);

  // Sync dashboard data
  const syncDashboardData = useCallback(async (onlineDashboardData) => {
    if (!isOnline || !onlineDashboardData) return false;

    try {
      const dashboardInfo = {
        lastSync: new Date().toISOString()
      };

      // Only store actual data, no empty arrays or 0 values
      if (onlineDashboardData.recentQuizzes && onlineDashboardData.recentQuizzes.length > 0) {
        dashboardInfo.recentQuizzes = onlineDashboardData.recentQuizzes;
      }
      if (onlineDashboardData.recentRoadmaps && onlineDashboardData.recentRoadmaps.length > 0) {
        dashboardInfo.recentRoadmaps = onlineDashboardData.recentRoadmaps;
      }
      
      if (onlineDashboardData.learningProgress) {
        const learningProgress = {};
        if (onlineDashboardData.learningProgress.currentStreak !== undefined) {
          learningProgress.currentStreak = onlineDashboardData.learningProgress.currentStreak;
        }
        if (onlineDashboardData.learningProgress.weeklyGoal !== undefined) {
          learningProgress.weeklyGoal = onlineDashboardData.learningProgress.weeklyGoal;
        }
        if (onlineDashboardData.learningProgress.weeklyProgress !== undefined) {
          learningProgress.weeklyProgress = onlineDashboardData.learningProgress.weeklyProgress;
        }
        if (onlineDashboardData.learningProgress.totalXP !== undefined) {
          learningProgress.totalXP = onlineDashboardData.learningProgress.totalXP;
        }
        if (Object.keys(learningProgress).length > 0) {
          dashboardInfo.learningProgress = learningProgress;
        }
      }
      
      if (onlineDashboardData.quickStats) {
        const quickStats = {};
        if (onlineDashboardData.quickStats.quizzesThisWeek !== undefined) {
          quickStats.quizzesThisWeek = onlineDashboardData.quickStats.quizzesThisWeek;
        }
        if (onlineDashboardData.quickStats.hoursThisWeek !== undefined) {
          quickStats.hoursThisWeek = onlineDashboardData.quickStats.hoursThisWeek;
        }
        if (onlineDashboardData.quickStats.roadmapsInProgress !== undefined) {
          quickStats.roadmapsInProgress = onlineDashboardData.quickStats.roadmapsInProgress;
        }
        if (Object.keys(quickStats).length > 0) {
          dashboardInfo.quickStats = quickStats;
        }
      }
      
      if (onlineDashboardData.upcomingTasks && onlineDashboardData.upcomingTasks.length > 0) {
        dashboardInfo.upcomingTasks = onlineDashboardData.upcomingTasks;
      }
      if (onlineDashboardData.achievements && onlineDashboardData.achievements.length > 0) {
        dashboardInfo.achievements = onlineDashboardData.achievements;
      }

      return dashboardData.saveOffline(dashboardInfo);
    } catch (error) {
      console.error('Error syncing dashboard data:', error);
      return false;
    }
  }, [isOnline, dashboardData]);

  // Sync quizzes data (view-only, questions without answers)
  const syncQuizzesData = useCallback(async (onlineQuizzesData) => {
    if (!isOnline || !onlineQuizzesData || !onlineQuizzesData.quizzes || onlineQuizzesData.quizzes.length === 0) {
      return false;
    }

    try {
      // Take only the actual quizzes and sanitize data for view-only mode
      const sanitizedQuizzes = onlineQuizzesData.quizzes
        .filter(quiz => quiz && quiz.title) // Only include quizzes with actual data
        .slice(-10) // Take last 10 quizzes instead of 5
        .map(quiz => {
          const sanitizedQuiz = {
            lastSync: new Date().toISOString()
          };

          // Only include actual quiz data
          if (quiz.id) sanitizedQuiz.id = quiz.id;
          if (quiz.title) sanitizedQuiz.title = quiz.title;
          if (quiz.subject) sanitizedQuiz.subject = quiz.subject;
          if (quiz.difficulty) sanitizedQuiz.difficulty = quiz.difficulty;
          if (quiz.duration) sanitizedQuiz.duration = quiz.duration;
          if (quiz.totalQuestions) sanitizedQuiz.totalQuestions = quiz.totalQuestions;
          if (quiz.createdAt) sanitizedQuiz.createdAt = quiz.createdAt;
          if (quiz.completedAt) sanitizedQuiz.completedAt = quiz.completedAt;
          if (quiz.score !== undefined) sanitizedQuiz.score = quiz.score;

          // Sanitize questions - remove answers and explanations
          if (quiz.questions && quiz.questions.length > 0) {
            sanitizedQuiz.questions = quiz.questions.map(question => {
              const sanitizedQuestion = {};
              if (question.id) sanitizedQuestion.id = question.id;
              if (question.question) sanitizedQuestion.question = question.question;
              if (question.type) sanitizedQuestion.type = question.type;
              if (question.options && question.options.length > 0) {
                sanitizedQuestion.options = question.options;
              }
              return sanitizedQuestion;
            });
          }

          return sanitizedQuiz;
        });

      if (sanitizedQuizzes.length === 0) return false;

      const quizData = {
        quizzes: sanitizedQuizzes,
        lastSync: new Date().toISOString(),
        totalCount: onlineQuizzesData.totalCount || sanitizedQuizzes.length
      };

      return quizzesData.saveOffline(quizData);
    } catch (error) {
      console.error('Error syncing quizzes data:', error);
      return false;
    }
  }, [isOnline, quizzesData]);

  // Comprehensive sync function
  const syncAllData = useCallback(async (onlineData) => {
    if (!isOnline || syncInProgress.current) return false;

    syncInProgress.current = true;
    
    try {
      const results = await Promise.allSettled([
        syncUserProfile(onlineData.userProfile),
        syncUserStats(onlineData.userStats),
        syncDashboardData(onlineData.dashboardData),
        syncQuizzesData(onlineData.quizzesData)
      ]);

      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      return successCount === results.length;
    } catch (error) {
      console.error('Error during comprehensive sync:', error);
      return false;
    } finally {
      syncInProgress.current = false;
    }
  }, [isOnline, syncUserProfile, syncUserStats, syncDashboardData, syncQuizzesData]);

  // Get sync status
  const getSyncStatus = useCallback(() => {
    const now = new Date();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    const getTimeSinceSync = (lastSync) => {
      if (!lastSync) return Infinity;
      return now - new Date(lastSync);
    };

    return {
      userProfile: {
        hasData: userProfile.isAvailable && userProfile.data !== null,
        data: userProfile.data,
        lastSync: userProfile.data?.lastSync,
        needsSync: getTimeSinceSync(userProfile.data?.lastSync) > oneHour
      },
      userStats: {
        hasData: userStats.isAvailable && userStats.data !== null,
        data: userStats.data,
        lastSync: userStats.data?.lastUpdated,
        needsSync: getTimeSinceSync(userStats.data?.lastUpdated) > oneHour
      },
      dashboardData: {
        hasData: dashboardData.isAvailable && dashboardData.data !== null,
        data: dashboardData.data,
        lastSync: dashboardData.data?.lastSync,
        needsSync: getTimeSinceSync(dashboardData.data?.lastSync) > oneHour
      },
      quizzesData: {
        hasData: quizzesData.isAvailable && quizzesData.data !== null,
        data: quizzesData.data,
        lastSync: quizzesData.data?.lastSync,
        needsSync: getTimeSinceSync(quizzesData.data?.lastSync) > oneHour
      },
      isOnline,
      syncInProgress: syncInProgress.current
    };
  }, [isOnline, userProfile, userStats, dashboardData, quizzesData]);

  return {
    syncUserProfile,
    syncUserStats,
    syncDashboardData,
    syncQuizzesData,
    syncAllData,
    getSyncStatus,
    isOnline
  };
};