import { html, TemplateResult, render } from 'lit-html';
import { BackendActor, ViewType, UserSearchMatch } from '../types';

export class UserSearch {
  private actor: BackendActor;
  private onViewChange: (view: ViewType, data?: any) => void;
  private onBack: () => void;
  private familyId: string;
  private familyName: string;
  private searchQuery: string;
  private onSearchQueryChange: (query: string) => void;
  private searchResults: UserSearchMatch[] = [];
  private loading = false;
  private message = '';
  private searchPerformed = false;
  private container: HTMLElement | null = null;

  constructor(
    actor: BackendActor,
    onViewChange: (view: ViewType, data?: any) => void,
    onBack: () => void,
    familyId: string,
    familyName: string,
    searchQuery: string,
    onSearchQueryChange: (query: string) => void
  ) {
    this.actor = actor;
    this.onViewChange = onViewChange;
    this.onBack = onBack;
    this.familyId = familyId;
    this.familyName = familyName;
    this.searchQuery = searchQuery;
    this.onSearchQueryChange = onSearchQueryChange;
  }

  private reRender(): void {
    // Force a re-render by triggering the parent app's render
    // This is a simple workaround since lit-html components don't have built-in reactivity
    console.log('Triggering re-render...');
    const event = new CustomEvent('userSearchUpdate');
    document.dispatchEvent(event);
  }

  private handleSearch = async () => {
    const sanitizedQuery = this.searchQuery.trim();
    
    // Enhanced input validation
    if (sanitizedQuery.length < 2) {
      this.message = 'Please enter at least 2 characters to search';
      this.reRender();
      return;
    }
    
    if (sanitizedQuery.length > 50) {
      this.message = 'Search query too long (max 50 characters)';
      this.reRender();
      return;
    }
    
    // Basic sanitization - remove potentially harmful characters
    const validPattern = /^[a-zA-Z0-9\s\-_.@]+$/;
    if (!validPattern.test(sanitizedQuery)) {
      this.message = 'Search query contains invalid characters';
      this.reRender();
      return;
    }

    this.loading = true;
    this.message = '';
    this.searchResults = [];
    this.reRender();

    console.log('About to call search_users with:', sanitizedQuery);
    console.log('Actor object:', this.actor);
    console.log('Actor methods:', Object.keys(this.actor));
    
    try {
      const result = await this.actor.search_users(sanitizedQuery);
      
      if ('Ok' in result) {
        this.searchResults = result.Ok;
        this.searchPerformed = true;
        if (result.Ok.length === 0) {
          this.message = ''; // Clear message so no-results section can show
        } else {
          this.message = ''; // Clear any previous messages on successful search
        }
      } else {
        this.message = result.Err;
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.message = 'Search failed. Please try again.';
    } finally {
      this.loading = false;
      this.reRender();
    }
  }

  private handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !this.loading) {
      this.handleSearch();
    }
  }

  private handleInviteUser = (user: UserSearchMatch) => {
    this.onViewChange('send-invitation', {
      familyId: this.familyId,
      familyName: this.familyName,
      targetUser: user
    });
  }

  renderTo(container: HTMLElement): void {
    this.container = container;
    render(this.render(), container);
  }

  render(): TemplateResult {
    return html`
      <div class="container">
        <div class="header">
          <h2>🔍 Search Users</h2>
          <button class="back-button" @click=${this.onBack}>
            ← Back
          </button>
        </div>

        <div class="search-section">
          <h3>Find users to invite to "${this.familyName}"</h3>
          
          <div class="search-form">
            <input
              type="text"
              class="search-input"
              placeholder="Search by name, surname, or user ID..."
              .value=${this.searchQuery}
              @input=${(e: Event) => {
                const newQuery = (e.target as HTMLInputElement).value;
                console.log('Search query updated:', newQuery, 'Length:', newQuery.trim().length);
                this.onSearchQueryChange(newQuery);
              }}
              @keypress=${this.handleKeyPress}
              ?disabled=${this.loading}
            />
            <button
              class="search-button"
              @click=${this.handleSearch}
              ?disabled=${(() => {
                const isDisabled = this.loading || this.searchQuery.trim().length < 2;
                console.log('Button disabled?', isDisabled, 'loading:', this.loading, 'query length:', this.searchQuery.trim().length);
                return isDisabled;
              })()}
            >
              ${this.loading ? html`<div class="loading-spinner"></div>` : ''}
              ${this.loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div class="search-help">
            💡 <strong>Search Tips:</strong> You can search by full name, surname, or unique user ID. 
            Results show users who have registered profiles and can be invited to join your family.
          </div>
        </div>

        ${this.message ? html`
          <div class="message ${this.message.includes('failed') || this.message.includes('error') ? 'error' : this.message.includes('No users found') ? 'error' : 'success'}">
            ${this.message}
          </div>
        ` : ''}

        ${this.searchPerformed && this.searchResults.length > 0 ? html`
          <div class="results-section">
            <div class="results-header">
              Found ${this.searchResults.length} user${this.searchResults.length === 1 ? '' : 's'}:
            </div>
            
            <div class="results-grid">
              ${this.searchResults.map(user => html`
                <div class="user-card">
                  <div class="user-info">
                    <div class="user-details">
                      <div class="user-name">${user.full_name}</div>
                      <div class="user-surname">Surname: ${user.surname_at_birth}</div>
                      <div class="user-id">ID: ${user.id}</div>
                    </div>
                    <button
                      class="invite-button"
                      @click=${() => this.handleInviteUser(user)}
                    >
                      📧 Send Invitation
                    </button>
                  </div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        ${this.searchPerformed && this.searchResults.length === 0 && !this.message && !this.loading ? html`
          <div class="no-results">
            <div class="no-results-icon">🔍</div>
            <div class="no-results-title">No users found matching "${this.searchQuery}"</div>
            <div class="no-results-suggestions">
              <div style="margin-top: 15px; font-size: 14px; color: #666;">
                <strong>💡 Search Tips:</strong>
              </div>
              <ul style="margin-top: 8px; font-size: 14px; color: #666; text-align: left; max-width: 400px;">
                <li>Try different spelling variations</li>
                <li>Search by first name, last name, or surname at birth</li>
                <li>Use partial names (e.g., "John" instead of "Jonathan")</li>
                <li>Make sure the user has registered on the platform</li>
              </ul>
              <div style="margin-top: 15px; font-size: 13px; color: #888;">
                Only registered users can be invited to join families.
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}