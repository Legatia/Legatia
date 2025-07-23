import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { Identity, HttpAgent, AnonymousIdentity } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { createActor } from 'declarations/Legatia_new_backend';
import { BackendActor } from './types';

const INTERNET_IDENTITY_URL = process.env.DFX_NETWORK === 'local' 
  ? 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943'
  : 'https://identity.ic0.app';

// Development mode - set to true to bypass Internet Identity
const DEV_MODE = false;

class AuthService {
  private authClient: AuthClient | null = null;
  private actor: BackendActor | null = null;
  private isAuthenticated: boolean = false;
  private principal: Principal | null = null;

  async init(): Promise<boolean> {
    if (DEV_MODE) {
      // Skip authentication in dev mode
      this.isAuthenticated = true;
      await this.setupDevActor();
      return true;
    }

    this.authClient = await AuthClient.create();
    this.isAuthenticated = await this.authClient.isAuthenticated();
    
    if (this.isAuthenticated) {
      await this.setupActor();
    }
    
    return this.isAuthenticated;
  }

  async login(): Promise<boolean> {
    if (DEV_MODE) {
      this.isAuthenticated = true;
      await this.setupDevActor();
      return true;
    }

    if (!this.authClient) {
      throw new Error('Auth client not initialized');
    }

    return new Promise((resolve, reject) => {
      this.authClient!.login({
        identityProvider: INTERNET_IDENTITY_URL,
        onSuccess: async () => {
          this.isAuthenticated = true;
          await this.setupActor();
          resolve(true);
        },
        onError: (error) => {
          console.error('Login failed:', error);
          reject(error);
        }
      });
    });
  }

  async logout(): Promise<void> {
    if (DEV_MODE) {
      this.isAuthenticated = false;
      this.actor = null;
      this.principal = null;
      return;
    }

    if (!this.authClient) {
      throw new Error('Auth client not initialized');
    }

    await this.authClient.logout();
    this.isAuthenticated = false;
    this.actor = null;
    this.principal = null;
  }

  private async setupActor(): Promise<void> {
    if (!this.authClient) {
      throw new Error('Auth client not initialized');
    }

    const identity: Identity = this.authClient.getIdentity();
    this.principal = identity.getPrincipal();
    
    // Use appropriate host based on environment and avoid CSP issues
    let agentHost: string;
    if (process.env.DFX_NETWORK === 'local') {
      const currentHost = window.location.origin;
      agentHost = currentHost.includes('localhost:4943') ? currentHost : 'http://localhost:4943';
    } else {
      agentHost = 'https://ic0.app';
    }
    
    // Create agent with proper configuration
    const agent = new HttpAgent({
      host: agentHost,
      identity,
    });

    // Fetch root key only in local development
    if (process.env.DFX_NETWORK === 'local') {
      try {
        await agent.fetchRootKey();
      } catch (error) {
        console.warn('Failed to fetch root key:', error);
      }
    }
    
    this.actor = createActor(process.env.CANISTER_ID_LEGATIA_NEW_BACKEND!, {
      agent,
    }) as unknown as BackendActor;
  }

  private async setupDevActor(): Promise<void> {
    // In dev mode, we still need to create an AuthClient for anonymous identity
    if (!this.authClient) {
      this.authClient = await AuthClient.create();
    }
    
    // Get the anonymous identity
    const identity = this.authClient.getIdentity();
    this.principal = identity.getPrincipal();
    
    console.log('Setting up dev actor with canister ID:', process.env.CANISTER_ID_LEGATIA_NEW_BACKEND);
    console.log('Using authenticated principal for dev mode');
    
    // Use appropriate host to avoid CSP issues
    const currentHost = window.location.origin;
    const agentHost = currentHost.includes('localhost:4943') ? currentHost : 'http://localhost:4943';
    
    // Create agent with proper configuration
    const agent = new HttpAgent({
      host: agentHost,
      identity,
    });

    // Fetch root key only in local development
    if (process.env.DFX_NETWORK === 'local') {
      try {
        await agent.fetchRootKey();
      } catch (error) {
        console.warn('Failed to fetch root key:', error);
      }
    }
    
    this.actor = createActor(process.env.CANISTER_ID_LEGATIA_NEW_BACKEND!, {
      agent,
    }) as unknown as BackendActor;
    
    console.log('Dev actor created successfully');
  }

  getActor(): BackendActor | null {
    return this.actor;
  }

  getPrincipal(): Principal | null {
    return this.principal;
  }

  getIsAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  // Mock login for development testing using a dfx identity
  async mockLogin(): Promise<boolean> {
    if (process.env.DFX_NETWORK !== 'local') {
      throw new Error('Mock login only available in local development');
    }

    // Create a mock identity with a known principal for consistent testing
    // This simulates having a real identity without needing Internet Identity
    const mockIdentity = Ed25519KeyIdentity.generate();
    this.principal = mockIdentity.getPrincipal();
    this.isAuthenticated = true;
    
    console.log('Mock login successful');
    
    await this.setupMockActor(mockIdentity);
    return true;
  }

  private async setupMockActor(identity: Identity): Promise<void> {
    console.log('Setting up mock actor with canister ID:', process.env.CANISTER_ID_LEGATIA_NEW_BACKEND);
    
    // Use the same host as the current page to avoid CSP issues
    const currentHost = window.location.origin;
    const agentHost = currentHost.includes('localhost:4943') ? currentHost : 'http://localhost:4943';
    
    console.log('Using agent host:', agentHost);
    
    // Create agent with mock identity
    const agent = new HttpAgent({
      host: agentHost,
      identity,
    });

    // Fetch root key for local development
    if (process.env.DFX_NETWORK === 'local') {
      try {
        await agent.fetchRootKey();
        console.log('Root key fetched successfully');
      } catch (error) {
        console.warn('Failed to fetch root key:', error);
        // Continue without root key - might still work
      }
    }
    
    this.actor = createActor(process.env.CANISTER_ID_LEGATIA_NEW_BACKEND!, {
      agent,
    }) as unknown as BackendActor;
    
    console.log('Mock actor created successfully');
  }

  // Check if we're in local development
  isLocalDevelopment(): boolean {
    return process.env.DFX_NETWORK === 'local';
  }
}

export const authService = new AuthService();

// Convenience function for components
export const getBackendActor = async (): Promise<BackendActor> => {
  const actor = authService.getActor();
  if (!actor) {
    throw new Error('Backend actor not available. Please authenticate first.');
  }
  return actor;
};