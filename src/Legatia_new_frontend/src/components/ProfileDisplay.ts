import { html, TemplateResult } from 'lit-html';
import { UserProfile } from '../types';

export class ProfileDisplay {
  private profile: UserProfile;
  private onEdit: () => void;
  private onViewFamilies: () => void;
  private onViewClaimRequests: () => void;
  private onViewAdminClaims: () => void;

  constructor(
    profile: UserProfile, 
    onEdit: () => void, 
    onViewFamilies: () => void,
    onViewClaimRequests: () => void,
    onViewAdminClaims: () => void
  ) {
    this.profile = profile;
    this.onEdit = onEdit;
    this.onViewFamilies = onViewFamilies;
    this.onViewClaimRequests = onViewClaimRequests;
    this.onViewAdminClaims = onViewAdminClaims;
  }

  private formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === '') return 'Not specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return raw string if can't parse as date
      }
      return date.toLocaleDateString();
    } catch (error) {
      return dateString; // Return raw string if error
    }
  }

  private formatTimestamp(timestamp: bigint): string {
    // Convert nanoseconds to milliseconds
    const milliseconds = Number(timestamp) / 1000000;
    return new Date(milliseconds).toLocaleString();
  }

  render(): TemplateResult {
    const { profile } = this;
    
    return html`
      <div class="profile-display">
        <h2>Your Profile</h2>
        <div class="profile-info">
          <div class="info-group">
            <label>Full Name:</label>
            <span>${profile.full_name}</span>
          </div>

          <div class="info-group">
            <label>Surname at Birth:</label>
            <span>${profile.surname_at_birth}</span>
          </div>

          <div class="info-group">
            <label>Sex:</label>
            <span>${profile.sex}</span>
          </div>

          <div class="info-group">
            <label>Birthday:</label>
            <span>${this.formatDate(profile.birthday)}</span>
          </div>

          <div class="info-group">
            <label>Birth City:</label>
            <span>${profile.birth_city}</span>
          </div>

          <div class="info-group">
            <label>Birth Country:</label>
            <span>${profile.birth_country}</span>
          </div>

          <div class="info-group">
            <label>Created:</label>
            <span>${this.formatTimestamp(profile.created_at)}</span>
          </div>

          <div class="info-group">
            <label>Last Updated:</label>
            <span>${this.formatTimestamp(profile.updated_at)}</span>
          </div>
        </div>

        <div class="profile-actions">
          <button @click=${this.onEdit} class="btn-secondary">
            Edit Profile
          </button>
          <button @click=${this.onViewFamilies} class="btn-primary">
            Manage Families
          </button>
        </div>

        <div class="ghost-profile-section">
          <h3>👻 Ghost Profile Claims</h3>
          <p>Manage your ghost profile claim requests and family admin duties.</p>
          <div class="ghost-actions">
            <button @click=${this.onViewClaimRequests} class="btn-secondary">
              📋 My Claim Requests
            </button>
            <button @click=${this.onViewAdminClaims} class="btn-secondary">
              ⚖️ Admin Claim Reviews
            </button>
          </div>
        </div>
      </div>
    `;
  }
}