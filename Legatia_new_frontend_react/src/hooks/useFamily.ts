import { useFamilyStore } from '../stores/familyStore';
import { CreateFamilyRequest, AddFamilyMemberRequest, AddEventRequest } from '../types';

export const useFamily = () => {
  const {
    families,
    currentFamily,
    loading,
    error,
    fetchFamilies,
    createFamily,
    selectFamily,
    fetchFamily,
    addFamilyMember,
    removeFamilyMember,
    addMemberEvent,
    toggleFamilyVisibility,
    clearError,
    reset,
  } = useFamilyStore();

  return {
    // State
    families,
    currentFamily,
    loading,
    error,
    
    // Actions
    fetchFamilies,
    createFamily,
    selectFamily,
    fetchFamily,
    addFamilyMember,
    removeFamilyMember,
    addMemberEvent,
    toggleFamilyVisibility,
    clearError,
    reset,
    
    // Computed
    hasFamilies: families.length > 0,
    isLoading: loading,
  };
};