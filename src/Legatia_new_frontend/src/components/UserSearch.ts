import { html, TemplateResult } from 'lit-html';
import { BackendActor, ViewType, UserSearchMatch } from '../types';

export class UserSearch {
  private actor: BackendActor;
  private onViewChange: (view: ViewType, data?: any) => void;
  private onBack: () => void;
  private familyId: string;
  private familyName: string;
  private searchQuery = '';
  private searchResults: UserSearchMatch[] = [];
  private loading = false;
  private message = '';
  private searchPerformed = false;

  constructor(
    actor: BackendActor,
    onViewChange: (view: ViewType, data?: any) => void,
    onBack: () => void,
    familyId: string,
    familyName: string
  ) {
    this.actor = actor;
    this.onViewChange = onViewChange;
    this.onBack = onBack;
    this.familyId = familyId;
    this.familyName = familyName;
  }


  private async handleSearch() {
    if (this.searchQuery.trim().length < 2) {
      this.message = 'Please enter at least 2 characters to search';
      return;
    }

    this.loading = true;
    this.message = '';
    this.searchResults = [];

    try {
      const result = await this.actor.search_users(this.searchQuery.trim());
      
      if ('Ok' in result) {
        this.searchResults = result.Ok;
        this.searchPerformed = true;
        if (result.Ok.length === 0) {
          this.message = `No users found matching "${this.searchQuery}"`;
        }
      } else {
        this.message = result.Err;
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.message = 'Search failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !this.loading) {
      this.handleSearch();
    }
  }

  private handleInviteUser(user: UserSearchMatch) {
    this.onViewChange('send-invitation', {
      familyId: this.familyId,
      familyName: this.familyName,
      targetUser: user
    });
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
              @input=${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value}
              @keypress=${this.handleKeyPress}
              ?disabled=${this.loading}
            />
            <button
              class="search-button"
              @click=${this.handleSearch}
              ?disabled=${this.loading || this.searchQuery.trim().length < 2}
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
            <div>No users found matching your search criteria.</div>
            <div style="margin-top: 10px; font-size: 14px;">
              Try searching with different keywords or check the spelling.
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}