import { html, render, TemplateResult } from 'lit-html';
import { authService } from './auth';
import { ProfileForm } from './components/ProfileForm';
import { ProfileDisplay } from './components/ProfileDisplay';
import { FamilyList } from './components/FamilyList';
import { FamilyDetail } from './components/FamilyDetail';
import { FamilyCreateForm } from './components/FamilyCreateForm';
import { AddFamilyMemberForm } from './components/AddFamilyMemberForm';
import { AddEventForm } from './components/AddEventForm';
import { GhostProfileMatches } from './components/GhostProfileMatches';
import { ClaimRequestsManager } from './components/ClaimRequestsManager';
import { UserSearch } from './components/UserSearch';
import { SendInvitation } from './components/SendInvitation';
import { MyInvitations } from './components/MyInvitations';
import { NotificationCenter } from './components/NotificationCenter';
import { 
  UserProfile, 
  CreateProfileRequest, 
  UpdateProfileRequest, 
  ViewType, 
  ProfileResult,
  Family,
  FamilyResult,
  FamilyListResult,
  CreateFamilyRequest,
  AddFamilyMemberRequest,
  AddEventRequest,
  FamilyMemberResult,
  FamilyEventResult,
  GhostProfileMatch,
  ProfileWithGhostResult,
  UserSearchMatch,
  FamilyInvitation,
  Notification
} from './types';
import legatiaLogo from '../assets/legatia_logo_with_title.png';

class App {
  private isAuthenticated: boolean = false;
  private profile: UserProfile | null = null;
  private currentView: ViewType = 'loading';
  private error: string = '';
  private loading: boolean = false;
  private families: Family[] = [];
  private currentFamily: Family | null = null;
  private currentMemberId: string = '';
  private currentMemberName: string = '';
  private ghostMatches: GhostProfileMatch[] = [];
  private targetUser: UserSearchMatch | null = null;
  private currentFamilyId: string = '';
  private currentFamilyName: string = '';
  private unreadNotificationCount: number = 0;
  
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

  private handleViewFamilies = async (): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      const actor = authService.getActor();
      if (!actor) {
        throw new Error('Actor not available');
      }

      const result: FamilyListResult = await actor.get_user_families();
      
      if ('Ok' in result) {
        this.families = result.Ok;
        this.currentView = 'families';
        this.error = '';
      } else {
        this.error = result.Err;
      }
    } catch (error) {
      console.error('Failed to load families:', error);
      this.error = 'Failed to load families';
    } finally {
      this.loading = false;
      this.render();
    }
  };

  private handleCreateFamily = (): void => {
    this.currentView = 'create-family';
    this.render();
  };

  private handleSubmitCreateFamily = async (familyData: CreateFamilyRequest): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      const actor = authService.getActor();
      if (!actor) {
        throw new Error('Actor not available');
      }

      const result: FamilyResult = await actor.create_family(familyData);
      
      if ('Ok' in result) {
        this.families.push(result.Ok);
        this.currentView = 'families';
        this.error = '';
      } else {
        this.error = result.Err;
      }
    } catch (error) {
      console.error('Failed to create family:', error);
      this.error = 'Failed to create family';
    } finally {
      this.loading = false;
      this.render();
    }
  };

  private handleViewFamily = async (familyId: string): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      const actor = authService.getActor();
      if (!actor) {
        throw new Error('Actor not available');
      }

      const result: FamilyResult = await actor.get_family(familyId);
      
      if ('Ok' in result) {
        this.currentFamily = result.Ok;
        this.currentView = 'family-detail';
        this.error = '';
      } else {
        this.error = result.Err;
      }
    } catch (error) {
      console.error('Failed to load family:', error);
      this.error = 'Failed to load family';
    } finally {
      this.loading = false;
      this.render();
    }
  };

  private handleAddMember = (familyId: string): void => {
    this.currentView = 'add-member';
    this.render();
  };

  private handleSubmitAddMember = async (memberData: AddFamilyMemberRequest): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      const actor = authService.getActor();
      if (!actor) {
        throw new Error('Actor not available');
      }

      const result: FamilyMemberResult = await actor.add_family_member(memberData);
      
      if ('Ok' in result) {
        // Refresh family data
        await this.handleViewFamily(memberData.family_id);
        this.error = '';
      } else {
        this.error = result.Err;
        this.loading = false;
        this.render();
      }
    } catch (error) {
      console.error('Failed to add member:', error);
      this.error = 'Failed to add member';
      this.loading = false;
      this.render();
    }
  };

  private handleAddEvent = (familyId: string, memberId: string): void => {
    // Find member name for display
    if (this.currentFamily) {
      const member = this.currentFamily.members.find(m => m.id === memberId);
      this.currentMemberName = member?.full_name || 'Unknown';
    }
    this.currentMemberId = memberId;
    this.currentView = 'add-event';
    this.render();
  };

  private handleSubmitAddEvent = async (eventData: AddEventRequest): Promise<void> => {
    try {
      this.loading = true;
      this.render();
      
      const actor = authService.getActor();
      if (!actor) {
        throw new Error('Actor not available');
      }

      const result: FamilyEventResult = await actor.add_member_event(eventData);
      
      if ('Ok' in result) {
        // Refresh family data
        await this.handleViewFamily(eventData.family_id);
        this.error = '';
      } else {
        this.error = result.Err;
        this.loading = false;
        this.render();
      }
    } catch (error) {
      console.error('Failed to add event:', error);
      this.error = 'Failed to add event';
      this.loading = false;
      this.render();
    }
  };

  private handleBackToFamilies = (): void => {
    this.currentView = 'families';
    this.currentFamily = null;
    this.render();
  };

  private handleBackToProfile = (): void => {
    this.currentView = 'profile';
    this.render();
  };

  private handleCancel = (): void => {
    if (this.currentFamily) {
      this.currentView = 'family-detail';
    } else {
      this.currentView = 'families';
    }
    this.error = '';
    this.render();
  };

  private handleFamilyUpdate = (updatedFamily: Family): void => {
    this.currentFamily = updatedFamily;
    // Update in families list if it exists there
    const index = this.families.findIndex(f => f.id === updatedFamily.id);
    if (index !== -1) {
      this.families[index] = updatedFamily;
    }
    this.render();
  };

  private handleBackFromGhostMatches = (): void => {
    this.currentView = 'profile';
    this.render();
  };

  private handleViewClaimRequests = (): void => {
    this.currentView = 'claim-requests';
    this.render();
  };

  private handleViewAdminClaims = (): void => {
    this.currentView = 'admin-claims';
    this.render();
  };

  private handleBackFromClaimRequests = (): void => {
    this.currentView = 'profile';
    this.render();
  };

  private handleViewMyInvitations = (): void => {
    this.currentView = 'my-invitations';
    this.render();
  };

  private handleViewNotifications = (): void => {
    this.currentView = 'notifications';
    this.render();
  };

  private handleSearchUsers = (familyId: string, familyName: string): void => {
    this.currentFamilyId = familyId;
    this.currentFamilyName = familyName;
    this.currentView = 'user-search';
    this.render();
  };

  private handleViewChange = (view: ViewType, data?: any): void => {
    this.currentView = view;
    
    // Handle view-specific data
    if (data) {
      switch (view) {
        case 'user-search':
          this.currentFamilyId = data.familyId || '';
          this.currentFamilyName = data.familyName || '';
          break;
        case 'send-invitation':
          this.currentFamilyId = data.familyId || '';
          this.currentFamilyName = data.familyName || '';
          this.targetUser = data.targetUser || null;
          break;
        case 'family-detail':
          if (data.familyId) {
            this.handleViewFamily(data.familyId);
            return; // handleViewFamily will call render
          }
          break;
        case 'add-member':
          if (data.familyId) {
            this.handleAddMember(data.familyId);
            return; // handleAddMember will call render
          }
          break;
        case 'add-event':
          if (data.familyId && data.memberId) {
            this.handleAddEvent(data.familyId, data.memberId);
            return; // handleAddEvent will call render
          }
          break;
      }
    }
    
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
    const display = new ProfileDisplay(
      this.profile, 
      this.handleEditProfile, 
      this.handleViewFamilies,
      this.handleViewClaimRequests,
      this.handleViewAdminClaims,
      this.handleViewMyInvitations,
      this.handleViewNotifications
    );
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

  private renderFamiliesView(): TemplateResult {
    const familyList = new FamilyList(this.families, this.handleCreateFamily, this.handleViewFamily);
    return html`
      <div class="families-view">
        <div class="view-header">
          <button @click=${this.handleBackToProfile} class="btn-back">← Back to Profile</button>
        </div>
        ${familyList.render()}
      </div>
    `;
  }

  private renderCreateFamilyView(): TemplateResult {
    const form = new FamilyCreateForm(this.handleSubmitCreateFamily, this.handleBackToFamilies);
    return form.render();
  }

  private renderFamilyDetailView(): TemplateResult {
    if (!this.currentFamily) {
      return html`<div>No family data available</div>`;
    }
    const detail = new FamilyDetail(
      this.currentFamily, 
      this.handleBackToFamilies, 
      this.handleAddMember, 
      this.handleAddEvent,
      this.handleFamilyUpdate,
      this.handleSearchUsers
    );
    return detail.render();
  }

  private renderAddMemberView(): TemplateResult {
    if (!this.currentFamily) {
      return html`<div>No family data available</div>`;
    }
    const form = new AddFamilyMemberForm(
      this.currentFamily.id,
      this.handleSubmitAddMember,
      this.handleCancel
    );
    return form.render();
  }

  private renderAddEventView(): TemplateResult {
    if (!this.currentFamily) {
      return html`<div>No family data available</div>`;
    }
    const form = new AddEventForm(
      this.currentFamily.id,
      this.currentMemberId,
      this.currentMemberName,
      this.handleSubmitAddEvent,
      this.handleCancel
    );
    return form.render();
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

  private renderGhostMatchesView(): TemplateResult {
    const ghostMatches = new GhostProfileMatches(this.ghostMatches, this.handleBackFromGhostMatches);
    return ghostMatches.render();
  }

  private renderClaimRequestsView(): TemplateResult {
    const claimManager = new ClaimRequestsManager('user', this.handleBackFromClaimRequests);
    return claimManager.render();
  }

  private renderAdminClaimsView(): TemplateResult {
    const claimManager = new ClaimRequestsManager('admin', this.handleBackFromClaimRequests);
    return claimManager.render();
  }

  private renderUserSearchView(): TemplateResult {
    const actor = authService.getActor();
    if (!actor) {
      return html`<div>Actor not available</div>`;
    }
    const userSearch = new UserSearch(
      actor,
      this.handleViewChange.bind(this),
      () => this.handleViewChange('family-detail', { familyId: this.currentFamilyId }),
      this.currentFamilyId,
      this.currentFamilyName
    );
    return userSearch.render();
  }

  private renderSendInvitationView(): TemplateResult {
    const actor = authService.getActor();
    if (!actor || !this.targetUser) {
      return html`<div>Actor or target user not available</div>`;
    }
    const sendInvitation = new SendInvitation(
      actor,
      this.handleViewChange.bind(this),
      () => this.handleViewChange('user-search'),
      this.currentFamilyId,
      this.currentFamilyName,
      this.targetUser
    );
    return sendInvitation.render();
  }

  private renderMyInvitationsView(): TemplateResult {
    const actor = authService.getActor();
    if (!actor) {
      return html`<div>Actor not available</div>`;
    }
    const myInvitations = new MyInvitations(
      actor,
      this.handleViewChange.bind(this),
      () => this.handleViewChange('profile')
    );
    return myInvitations.render();
  }

  private renderNotificationsView(): TemplateResult {
    const actor = authService.getActor();
    if (!actor) {
      return html`<div>Actor not available</div>`;
    }
    const notificationCenter = new NotificationCenter(
      actor,
      this.handleViewChange.bind(this),
      () => this.handleViewChange('profile')
    );
    return notificationCenter.render();
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
      case 'families':
        content = this.renderFamiliesView();
        break;
      case 'create-family':
        content = this.renderCreateFamilyView();
        break;
      case 'family-detail':
        content = this.renderFamilyDetailView();
        break;
      case 'add-member':
        content = this.renderAddMemberView();
        break;
      case 'add-event':
        content = this.renderAddEventView();
        break;
      case 'ghost-matches':
        content = this.renderGhostMatchesView();
        break;
      case 'claim-requests':
        content = this.renderClaimRequestsView();
        break;
      case 'admin-claims':
        content = this.renderAdminClaimsView();
        break;
      case 'user-search':
        content = this.renderUserSearchView();
        break;
      case 'send-invitation':
        content = this.renderSendInvitationView();
        break;
      case 'my-invitations':
        content = this.renderMyInvitationsView();
        break;
      case 'notifications':
        content = this.renderNotificationsView();
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