import { create } from 'zustand';
import { Family, FamilyMember, FamilyEvent, CreateFamilyRequest, AddFamilyMemberRequest, AddEventRequest } from '../types';
import { useAuthStore } from './authStore';

interface FamilyState {
  // State
  families: Family[];
  currentFamily: Family | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchFamilies: () => Promise<void>;
  createFamily: (data: CreateFamilyRequest) => Promise<void>;
  selectFamily: (familyId: string) => void;
  fetchFamily: (familyId: string) => Promise<void>;
  addFamilyMember: (data: AddFamilyMemberRequest) => Promise<void>;
  removeFamilyMember: (familyId: string, memberId: string) => Promise<void>;
  addMemberEvent: (data: AddEventRequest) => Promise<void>;
  toggleFamilyVisibility: (familyId: string, isVisible: boolean) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  // Initial state
  families: [],
  currentFamily: null,
  loading: false,
  error: null,

  // Fetch user's families
  fetchFamilies: async () => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.get_user_families();
      
      if ('Ok' in result) {
        set({ 
          families: result.Ok,
          loading: false 
        });
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Fetch families failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch families',
        loading: false 
      });
    }
  },

  // Create new family
  createFamily: async (data: CreateFamilyRequest) => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.create_family(data);
      
      if ('Ok' in result) {
        const newFamily = result.Ok;
        set((state) => ({ 
          families: [...state.families, newFamily],
          currentFamily: newFamily,
          loading: false 
        }));
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Create family failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create family',
        loading: false 
      });
    }
  },

  // Select current family
  selectFamily: (familyId: string) => {
    const { families } = get();
    const family = families.find(f => f.id === familyId);
    if (family) {
      set({ currentFamily: family });
    }
  },

  // Fetch specific family details
  fetchFamily: async (familyId: string) => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.get_family(familyId);
      
      if ('Ok' in result) {
        const family = result.Ok;
        set((state) => ({
          currentFamily: family,
          families: state.families.map(f => f.id === familyId ? family : f),
          loading: false
        }));
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Fetch family failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch family',
        loading: false 
      });
    }
  },

  // Add family member
  addFamilyMember: async (data: AddFamilyMemberRequest) => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.add_family_member(data);
      
      if ('Ok' in result) {
        // Refresh the current family to show new member
        await get().fetchFamily(data.family_id);
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Add family member failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add family member',
        loading: false 
      });
    }
  },

  // Remove family member
  removeFamilyMember: async (familyId: string, memberId: string) => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.remove_family_member(familyId, memberId);
      
      if ('Ok' in result) {
        // Refresh the current family to remove member
        await get().fetchFamily(familyId);
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Remove family member failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove family member',
        loading: false 
      });
    }
  },

  // Add member event
  addMemberEvent: async (data: AddEventRequest) => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.add_member_event(data);
      
      if ('Ok' in result) {
        // Refresh the current family to show new event
        await get().fetchFamily(data.family_id);
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Add member event failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add event',
        loading: false 
      });
    }
  },

  // Toggle family visibility
  toggleFamilyVisibility: async (familyId: string, isVisible: boolean) => {
    const actor = useAuthStore.getState().actor;
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.toggle_family_visibility(familyId, isVisible);
      
      if ('Ok' in result) {
        // Update the family in state
        set((state) => ({
          families: state.families.map(f => 
            f.id === familyId ? { ...f, is_visible: isVisible } : f
          ),
          currentFamily: state.currentFamily?.id === familyId 
            ? { ...state.currentFamily, is_visible: isVisible }
            : state.currentFamily,
          loading: false
        }));
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Toggle family visibility failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to toggle visibility',
        loading: false 
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({ families: [], currentFamily: null, loading: false, error: null }),
}));