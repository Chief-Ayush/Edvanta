import React from 'react';
import { useOfflineQuizzes } from '../../hooks/useOfflineStorage';

const OfflineQuizzesViewer = ({ className = "" }) => {
  const { data: quizzesData, isAvailable } = useOfflineQuizzes();

  if (!isAvailable || !quizzesData || !quizzesData.quizzes || quizzesData.quizzes.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Cached Quizzes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sync your data when online to view your quizzes here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Cached Quizzes ({quizzesData.totalCount || quizzesData.quizzes.length})
      </h2>
      
      {/* Offline Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">View-Only Mode</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>You're viewing cached quiz data. Connect to the internet to take new quizzes.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {quizzesData.quizzes.map((quiz, index) => (
          <div key={quiz.id || index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {quiz.title && (
                  <h3 className="text-sm font-medium text-gray-900">{quiz.title}</h3>
                )}
                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                  {quiz.subject && <span>📚 {quiz.subject}</span>}
                  {quiz.duration && <span>⏱️ {quiz.duration}min</span>}
                  {quiz.totalQuestions && <span>❓ {quiz.totalQuestions} questions</span>}
                  {quiz.difficulty && <span>📊 {quiz.difficulty}</span>}
                </div>
              </div>
              {quiz.score !== undefined && (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{quiz.score}%</div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              )}
            </div>
            {quiz.completedAt && (
              <div className="mt-2 text-xs text-gray-400">
                Completed: {new Date(quiz.completedAt).toLocaleDateString()}
              </div>
            )}
            
            {/* Show sample questions if available */}
            {quiz.questions && quiz.questions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2">
                  Preview Questions (Answers hidden in offline mode)
                </div>
                <div className="space-y-2">
                  {quiz.questions.slice(0, 2).map((question, qIndex) => (
                    <div key={question.id || qIndex} className="text-sm">
                      <div className="font-medium text-gray-800">
                        {qIndex + 1}. {question.question}
                      </div>
                      {question.options && question.options.length > 0 && (
                        <div className="mt-1 ml-4 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="text-gray-600 text-xs">
                              • {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {quiz.questions.length > 2 && (
                    <div className="text-xs text-gray-500 italic">
                      ... and {quiz.questions.length - 2} more questions
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Last Sync Info */}
      {quizzesData.lastSync && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Last synced: {new Date(quizzesData.lastSync).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default OfflineQuizzesViewer;