import { html, render, TemplateResult } from 'lit-html';
import { authService } from './auth';
import { ProfileForm } from './components/ProfileForm';
import { ProfileDisplay } from './components/ProfileDisplay';
import { UserProfile, CreateProfileRequest, UpdateProfileRequest, ViewType, ProfileResult } from './types';
import legatiaLogo from '../assets/legatia_logo_with_title.png';

class App {
  private isAuthenticated: boolean = false;
  private profile: UserProfile | null = null;
  private currentView: ViewType = 'loading';
  private error: string = '';
  private loading: boolean = false;
  
  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      this.isAuthenticated = await authService.init();
      
      if (this.isAuthenticated) {
        await this.loadProfile();
      } else {
        this.currentView = 'login';
      }
    } catch (error) {
      console.error('Initialization failed:', error);
      this.error = 'Failed to initialize application';
      this.currentView = 'error';
    }
    
    this.render();
  }

  private async loadProfile(): Promise<void> {
    try {
      this.loading = true;
      this.render();
      
      const actor = authService.getActor();
      if (!actor) {
        throw new Error('Actor not available');
      }

      // First test with whoami to ensure the connection works
      console.log('Testing connection with whoami...');
      const whoami = await actor.whoami();
      console.log('Whoami result:', whoami.toString());
      
      console.log('Calling get_profile...');
      const result: ProfileResult = await actor.get_profile();
      console.log('Profile result:', result);
      
      if ('Ok' in result) {
        this.profile = result.Ok;
        this.currentView = 'profile';
      } else {
        // No profile exists yet - this is expected for new users
        console.log('No profile found, showing create form:', result.Err);
        this.currentView = 'create-profile';
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      
      // If it's just that no profile exists, show create form instead of error
      if (error instanceof Error && error.message.includes('Profile not found')) {
        this.currentView = 'create-profile';
      } else {
        this.error = `Failed to load profile: ${error}`;
        this.currentView = 'error';
      }
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private handleLogin = async (): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      await authService.login();
      this.isAuthenticated = true;
      await this.loadProfile();
    } catch (error) {
      console.error('Login failed:', error);
      this.error = 'Login failed';
      this.currentView = 'error';
    } finally {
      this.loading = false;
      this.render();
    }
  };

  private handleMockLogin = async (): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      await authService.mockLogin();
      this.isAuthenticated = true;
      await this.loadProfile();
    } catch (error) {
      console.error('Mock login failed:', error);
      this.error = 'Mock login failed';
      this.currentView = 'error';
    } finally {
      this.loading = false;
      this.render();
    }
  };

  private handleLogout = async (): Promise<void> => {
    await authService.logout();
    this.isAuthenticated = false;
    this.profile = null;
    this.currentView = 'login';
    this.render();
  };

  private handleCreateProfile = async (profileData: CreateProfileRequest): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      const actor = authService.getActor();
      if (!actor) {
        throw new Error('Actor not available');
      }

      const result: ProfileResult = await actor.create_profile(profileData);
      
      if ('Ok' in result) {
        this.profile = result.Ok;
        this.currentView = 'profile';
        this.error = '';
      } else {
        this.error = result.Err;
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      this.error = 'Failed to create profile';
    } finally {
      this.loading = false;
      this.render();
    }
  };

  private handleUpdateProfile = async (updateData: UpdateProfileRequest): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      const actor = authService.getActor();
      if (!actor) {
        throw new Error('Actor not available');
      }

      const result: ProfileResult = await actor.update_profile(updateData);
      
      if ('Ok' in result) {
        this.profile = result.Ok;
        this.currentView = 'profile';
        this.error = '';
      } else {
        this.error = result.Err;
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      this.error = 'Failed to update profile';
    } finally {
      this.loading = false;
      this.render();
    }
  };

  private handleEditProfile = (): void => {
    this.currentView = 'edit-profile';
    this.render();
  };

  private handleCancelEdit = (): void => {
    this.currentView = 'profile';
    this.error = '';
    this.render();
  };

  private renderLoginView(): TemplateResult {
    return html`
      <div class="login-view">
        <div class="login-logo">
          <img src="${legatiaLogo}" alt="Legatia Family Tree" class="main-logo" />
        </div>
        <h2>Welcome to Your Digital Family Legacy</h2>
        <p>Create and preserve your family history on the Internet Computer blockchain. Start by authenticating with Internet Identity to access your eternal family profile.</p>
        
        <div class="login-buttons">
          <button @click=${this.handleLogin} class="btn-primary" ?disabled=${this.loading}>
            ${this.loading ? 'Connecting...' : 'Login with Internet Identity'}
          </button>
          
          ${authService.isLocalDevelopment() ? html`
            <div class="dev-options">
              <p class="dev-divider">or for testing</p>
              <button @click=${this.handleMockLogin} class="btn-secondary" ?disabled=${this.loading}>
                ${this.loading ? 'Connecting...' : 'Mock Login (Dev Only)'}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private renderCreateProfileView(): TemplateResult {
    const form = new ProfileForm(this.handleCreateProfile);
    return form.render();
  }

  private renderProfileView(): TemplateResult {
    if (!this.profile) {
      return html`<div>No profile data available</div>`;
    }
    const display = new ProfileDisplay(this.profile, this.handleEditProfile);
    return display.render();
  }

  private renderEditProfileView(): TemplateResult {
    if (!this.profile) {
      return html`<div>No profile data available</div>`;
    }
    const form = new ProfileForm(this.handleUpdateProfile, this.profile);
    return html`
      ${form.render()}
      <button @click=${this.handleCancelEdit} class="btn-secondary">
        Cancel
      </button>
    `;
  }

  private renderLoadingView(): TemplateResult {
    return html`
      <div class="loading-view">
        <img src="${legatiaLogo}" alt="Legatia" class="logo-small" />
        <p>Loading your family legacy...</p>
      </div>
    `;
  }

  private renderErrorView(): TemplateResult {
    return html`
      <div class="error-view">
        <img src="${legatiaLogo}" alt="Legatia" class="logo-small" />
        <h2>Something went wrong</h2>
        <p>${this.error}</p>
        <button @click=${() => window.location.reload()} class="btn-primary">
          Try Again
        </button>
      </div>
    `;
  }

  private render(): void {
    let content: TemplateResult;
    
    switch (this.currentView) {
      case 'loading':
        content = this.renderLoadingView();
        break;
      case 'login':
        content = this.renderLoginView();
        break;
      case 'create-profile':
        content = this.renderCreateProfileView();
        break;
      case 'profile':
        content = this.renderProfileView();
        break;
      case 'edit-profile':
        content = this.renderEditProfileView();
        break;
      case 'error':
        content = this.renderErrorView();
        break;
      default:
        content = this.renderLoadingView();
    }

    const body = html`
      <main>
        ${this.currentView !== 'login' && this.currentView !== 'loading' && this.currentView !== 'error' ? html`
          <header>
            <img src="${legatiaLogo}" alt="Legatia Family Tree" class="header-logo" />
            ${this.isAuthenticated ? html`
              <div class="user-info">
                <span>Principal: ${authService.getPrincipal()?.toString()}</span>
                <button @click=${this.handleLogout} class="btn-secondary">Logout</button>
              </div>
            ` : ''}
          </header>
        ` : ''}
        
        ${this.error && this.currentView !== 'error' ? html`
          <div class="error-message">
            ${this.error}
          </div>
        ` : ''}
        
        ${this.loading && this.currentView !== 'loading' ? html`
          <div class="loading-indicator">
            Processing...
          </div>
        ` : ''}
        
        <div class="content">
          ${content}
        </div>
      </main>
    `;

    render(body, document.getElementById('root')!);
  }
}

export default App;