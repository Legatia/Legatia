import { html, TemplateResult } from 'lit-html';
import { BackendActor, UserSearchMatch, SendInvitationRequest, ViewType } from '../types';

export class SendInvitation {
  private actor: BackendActor;
  private onViewChange: (view: ViewType, data?: any) => void;
  private onBack: () => void;
  private familyId: string;
  private familyName: string;
  private targetUser: UserSearchMatch;
  private relationship = '';
  private message = '';
  private loading = false;
  private statusMessage = '';

  constructor(
    actor: BackendActor,
    onViewChange: (view: ViewType, data?: any) => void,
    onBack: () => void,
    familyId: string,
    familyName: string,
    targetUser: UserSearchMatch
  ) {
    this.actor = actor;
    this.onViewChange = onViewChange;
    this.onBack = onBack;
    this.familyId = familyId;
    this.familyName = familyName;
    this.targetUser = targetUser;
  }

  private relationshipOptions = [
    'spouse',
    'child',
    'parent',
    'sibling',
    'grandparent',
    'grandchild',
    'aunt',
    'uncle',
    'cousin',
    'niece',
    'nephew',
    'in-law',
    'friend',
    'other'
  ];

  private async handleSendInvitation() {
    if (!this.relationship.trim()) {
      this.statusMessage = 'Please select a relationship';
      return;
    }

    this.loading = true;
    this.statusMessage = '';

    const request: SendInvitationRequest = {
      family_id: this.familyId,
      user_id: this.targetUser.id,
      relationship_to_admin: this.relationship,
      message: this.message.trim() ? [this.message.trim()] : []
    };

    try {
      const result = await this.actor.send_family_invitation(request);
      
      if ('Ok' in result) {
        this.statusMessage = 'Invitation sent successfully! The user will receive a notification.';
        // Navigate back to family detail after a short delay
        setTimeout(() => {
          this.onViewChange('family-detail', { familyId: this.familyId });
        }, 2000);
      } else {
        this.statusMessage = `Failed to send invitation: ${result.Err}`;
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      this.statusMessage = 'Failed to send invitation. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private generatePreviewMessage(): string {
    if (!this.relationship) {
      return 'Please select a relationship to see the invitation preview.';
    }

    const messageText = this.message.trim() ? `\n\nPersonal message: "${this.message}"` : '';
    return `You have been invited to join the "${this.familyName}" family as their ${this.relationship}. ${messageText}`;
  }

  private handleRelationshipSelect(relationship: string) {
    this.relationship = relationship;
  }

  render(): TemplateResult {
    return html`
      <div class="container">
        <div class="header">
          <h2>📨 Send Family Invitation</h2>
          <button class="back-button" @click=${this.onBack}>
            ← Back
          </button>
        </div>

        <div class="invitation-form">
          <div class="target-user-info">
            <div class="target-user-name">${this.targetUser.full_name}</div>
            <div class="target-user-details">Surname: ${this.targetUser.surname_at_birth}</div>
            <div class="target-user-id">ID: ${this.targetUser.id}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Relationship to You (Family Admin) *</label>
            <div class="relationship-grid">
              ${this.relationshipOptions.map(option => html`
                <div
                  class="relationship-option ${this.relationship === option ? 'selected' : ''}"
                  @click=${() => this.handleRelationshipSelect(option)}
                >
                  ${option}
                </div>
              `)}
            </div>
            <div class="form-help">
              Select how ${this.targetUser.full_name} is related to you in the family tree.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="message">Personal Message (Optional)</label>
            <textarea
              id="message"
              class="form-textarea"
              placeholder="Add a personal message to explain why you're inviting them..."
              .value=${this.message}
              @input=${(e: Event) => this.message = (e.target as HTMLTextAreaElement).value}
              ?disabled=${this.loading}
            ></textarea>
            <div class="form-help">
              This message will be included in their invitation notification.
            </div>
          </div>

          <div class="preview-section">
            <span class="preview-label">📋 Invitation Preview:</span>
            <div class="preview-message">
              ${this.generatePreviewMessage()}
            </div>
          </div>

          ${this.statusMessage ? html`
            <div class="message ${this.statusMessage.includes('successfully') ? 'success' : 'error'}">
              ${this.statusMessage}
            </div>
          ` : ''}

          <div class="form-actions">
            <button class="back-button" @click=${this.onBack} ?disabled=${this.loading}>
              Cancel
            </button>
            <button
              class="send-button"
              @click=${this.handleSendInvitation}
              ?disabled=${this.loading || !this.relationship.trim()}
            >
              ${this.loading ? html`<div class="loading-spinner"></div>` : ''}
              ${this.loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}