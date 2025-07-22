import { html, TemplateResult } from 'lit-html';
import { UserProfile } from '../types';

export class ProfileDisplay {
  private profile: UserProfile;
  private onEdit: () => void;
  private onViewFamilies: () => void;

  constructor(profile: UserProfile, onEdit: () => void, onViewFamilies: () => void) {
    this.profile = profile;
    this.onEdit = onEdit;
    this.onViewFamilies = onViewFamilies;
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
      </div>
    `;
  }
}