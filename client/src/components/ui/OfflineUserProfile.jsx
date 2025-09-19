import React from 'react';
import { useOfflineUserProfile } from '../../hooks/useOfflineStorage';

const OfflineUserProfile = ({ className = "" }) => {
  const { data: userProfile, isAvailable } = useOfflineUserProfile();

  if (!isAvailable || !userProfile) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Cached Profile Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sync your data when online to view your profile here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cached Profile</h2>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {userProfile.photoURL ? (
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={userProfile.photoURL}
                alt={userProfile.displayName || 'User'}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center ${userProfile.photoURL ? 'hidden' : 'flex'}`}>
              <svg className="h-6 w-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {userProfile.displayName && (
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {userProfile.displayName}
              </h3>
            )}
            {userProfile.email && (
              <p className="text-sm text-gray-500 truncate">
                {userProfile.email}
              </p>
            )}
            {userProfile.emailVerified !== undefined && (
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  userProfile.emailVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {userProfile.emailVerified ? '✓ Verified' : 'Unverified'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Interests */}
        {userProfile.interests && userProfile.interests.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {userProfile.interests.map((interest, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preferences */}
        {userProfile.preferences && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preferences</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              {userProfile.preferences.theme && (
                <div>
                  <span className="font-medium">Theme:</span> {userProfile.preferences.theme}
                </div>
              )}
              {userProfile.preferences.language && (
                <div>
                  <span className="font-medium">Language:</span> {userProfile.preferences.language}
                </div>
              )}
              {userProfile.preferences.notifications !== undefined && (
                <div>
                  <span className="font-medium">Notifications:</span> {userProfile.preferences.notifications ? 'On' : 'Off'}
                </div>
              )}
            </div>
          </div>
        )}

        {userProfile.lastSync && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Last synced: {new Date(userProfile.lastSync).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineUserProfile;