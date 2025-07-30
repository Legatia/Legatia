import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ProfileForm } from '../components/profile/ProfileForm';
import { useAuth } from '../hooks/useAuth';
import { CreateProfileRequest } from '../types';
import toast from 'react-hot-toast';

export const CreateProfilePage: React.FC = () => {
  const { hasProfile, createProfile, loading, error, clearError } = useAuth();

  // Clear any existing errors when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  // Redirect if user already has a profile
  if (hasProfile) {
    return <Navigate to="/families" replace />;
  }

  const handleSubmit = async (data: CreateProfileRequest) => {
    try {
      await createProfile(data);
      toast.success('Profile created successfully!');
    } catch (err) {
      toast.error('Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <ProfileForm
          onSubmit={handleSubmit}
          loading={loading}
          title="Create Your Profile"
          description="Welcome to Legatia! Let's start by creating your profile to begin building your family tree."
          submitText="Create Profile"
        />
      </div>
    </div>
  );
};