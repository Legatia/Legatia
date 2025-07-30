import { create } from 'zustand';
import { Principal } from '@dfinity/principal';
import { authService } from '../services/auth';
import { UserProfile, CreateProfileRequest, UpdateProfileRequest, BackendActor } from '../types';

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: UserProfile | null;
  principal: Principal | null;
  loading: boolean;
  error: string | null;
  actor: BackendActor | null;

  // Actions
  init: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  createProfile: (data: CreateProfileRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  principal: null,
  loading: false,
  error: null,
  actor: null,

  // Initialize auth service
  init: async () => {
    set({ loading: true, error: null });
    try {
      const isAuthenticated = await authService.init();
      const actor = authService.getActor();
      const principal = authService.getPrincipal();

      set({ 
        isAuthenticated, 
        actor, 
        principal,
        loading: false 
      });

      // If authenticated, fetch user profile
      if (isAuthenticated && actor) {
        await get().fetchProfile();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Authentication failed',
        loading: false 
      });
    }
  },

  // Login user
  login: async () => {
    set({ loading: true, error: null });
    try {
      const success = await authService.login();
      if (success) {
        const actor = authService.getActor();
        const principal = authService.getPrincipal();
        
        set({ 
          isAuthenticated: true, 
          actor, 
          principal,
          loading: false 
        });

        // Fetch user profile after login
        await get().fetchProfile();
      }
    } catch (error) {
      console.error('Login failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        loading: false 
      });
    }
  },

  // Logout user
  logout: async () => {
    set({ loading: true });
    try {
      await authService.logout();
      set({ 
        isAuthenticated: false,
        user: null,
        principal: null,
        actor: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Logout failed',
        loading: false 
      });
    }
  },

  // Create user profile
  createProfile: async (data: CreateProfileRequest) => {
    const { actor } = get();
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.create_profile(data);
      
      if ('Ok' in result) {
        set({ 
          user: result.Ok,
          loading: false 
        });
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Create profile failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create profile',
        loading: false 
      });
    }
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileRequest) => {
    const { actor } = get();
    if (!actor) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const result = await actor.update_profile(data);
      
      if ('Ok' in result) {
        set({ 
          user: result.Ok,
          loading: false 
        });
      } else {
        set({ 
          error: result.Err,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Update profile failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update profile',
        loading: false 
      });
    }
  },

  // Fetch user profile
  fetchProfile: async () => {
    const { actor } = get();
    if (!actor) return;

    set({ loading: true, error: null });
    try {
      const result = await actor.get_profile();
      
      if ('Ok' in result) {
        set({ 
          user: result.Ok,
          loading: false 
        });
      } else {
        // User doesn't have a profile yet - this is okay
        set({ 
          user: null,
          loading: false 
        });
      }
    } catch (error) {
      console.error('Fetch profile failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        loading: false 
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Set loading state
  setLoading: (loading: boolean) => set({ loading }),
}));