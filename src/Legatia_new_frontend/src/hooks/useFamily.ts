import { useFamilyStore } from '../stores/familyStore';
import { CreateFamilyRequest, AddFamilyMemberRequest, AddEventRequest, UpdateFamilyMemberRequest, UpdateEventRequest } from '../types';

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
    updateFamilyMember,
    addMemberEvent,
    updateMemberEvent,
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
    updateFamilyMember,
    addMemberEvent,
    updateMemberEvent,
    toggleFamilyVisibility,
    clearError,
    reset,
    
    // Computed
    hasFamilies: families.length > 0,
    isLoading: loading,
  };
};