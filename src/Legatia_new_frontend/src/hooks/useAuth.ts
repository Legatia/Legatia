import { useAuthStore } from '../stores/authStore';
import { CreateProfileRequest, UpdateProfileRequest } from '../types';

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    principal,
    loading,
    error,
    init,
    login,
    mockLogin,
    logout,
    createProfile,
    updateProfile,
    fetchProfile,
    clearError,
  } = useAuthStore();

  return {
    // State
    isAuthenticated,
    user,
    principal,
    loading,
    error,
    
    // Actions
    init,
    login,
    mockLogin,
    logout,
    createProfile,
    updateProfile,
    fetchProfile,
    clearError,
    
    // Computed
    hasProfile: !!user,
    isLoading: loading,
  };
};