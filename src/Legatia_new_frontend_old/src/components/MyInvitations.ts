import { html, TemplateResult } from 'lit-html';
import { BackendActor, FamilyInvitation, ProcessInvitationRequest, ViewType } from '../types';

export class MyInvitations {
  private actor: BackendActor;
  private onViewChange: (view: ViewType, data?: any) => void;
  private onBack: () => void;
  private invitations: FamilyInvitation[] = [];
  private loading = true;
  private message = '';
  private processingInvitations = new Set<string>();

  constructor(
    actor: BackendActor,
    onViewChange: (view: ViewType, data?: any) => void,
    onBack: () => void
  ) {
    this.actor = actor;
    this.onViewChange = onViewChange;
    this.onBack = onBack;
    this.loadInvitations();
  }

  private async loadInvitations() {
    try {
      const result = await this.actor.get_my_invitations();
      
      if ('Ok' in result) {
        this.invitations = result.Ok.sort((a, b) => {
          // Sort by status (pending first) then by creation date (newest first)
          if (a.status !== b.status) {
            if ('Pending' in a.status) return -1;
            if ('Pending' in b.status) return 1;
          }
          return Number(b.created_at - a.created_at);
        });
      } else {
        this.message = `Failed to load invitations: ${result.Err}`;
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
      this.message = 'Failed to load invitations. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  private async processInvitation(invitationId: string, accept: boolean) {
    this.processingInvitations.add(invitationId);
    this.message = '';

    const request: ProcessInvitationRequest = {
      invitation_id: invitationId,
      accept
    };

    try {
      const result = await this.actor.process_family_invitation(request);
      
      if ('Ok' in result) {
        // Update the invitation locally
        const invitation = this.invitations.find(inv => inv.id === invitationId);
        if (invitation) {
          invitation.status = accept ? { Accepted: null } : { Declined: null };
        }
        
        this.message = accept 
          ? 'Invitation accepted! You are now a member of the family.'
          : 'Invitation declined.';
      } else {
        this.message = `Failed to process invitation: ${result.Err}`;
      }
    } catch (error) {
      console.error('Failed to process invitation:', error);
      this.message = 'Failed to process invitation. Please try again.';
    } finally {
      this.processingInvitations.delete(invitationId);
    }
  }

  private formatDate(timestamp: bigint): string {
    try {
      const date = new Date(Number(timestamp / 1000000n));
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)}d ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return 'Unknown date';
    }
  }

  private getStatusText(status: any): string {
    const statusKey = Object.keys(status)[0];
    return statusKey.toLowerCase();
  }

  private getStatusClass(status: any): string {
    const statusKey = Object.keys(status)[0];
    return `status-${statusKey.toLowerCase()}`;
  }

  private isPending(status: any): boolean {
    return 'Pending' in status;
  }

  private handleViewFamily(familyId: string) {
    this.onViewChange('family-detail', { familyId });
  }

  render(): TemplateResult {
    if (this.loading) {
      return html`
        <div class="container">
          <div class="header">
            <h2>📨 My Family Invitations</h2>
            <button class="back-button" @click=${this.onBack}>
              ← Back to Profile
            </button>
          </div>
          
          <div class="loading">
            <div class="loading-spinner"></div>
            Loading your invitations...
          </div>
        </div>
      `;
    }

    const pendingInvitations = this.invitations.filter(inv => this.isPending(inv.status));
    const processedInvitations = this.invitations.filter(inv => !this.isPending(inv.status));

    return html`
      <div class="container">
        <div class="header">
          <h2>📨 My Family Invitations</h2>
          <button class="back-button" @click=${this.onBack}>
            ← Back to Profile
          </button>
        </div>

        ${this.message ? html`
          <div class="message ${this.message.includes('Failed') || this.message.includes('error') ? 'error' : 'success'}">
            ${this.message}
          </div>
        ` : ''}

        ${pendingInvitations.length > 0 ? html`
          <div class="section">
            <h3 class="section-title">⏳ Pending Invitations (${pendingInvitations.length})</h3>
            <div class="invitations-grid">
              ${pendingInvitations.map(invitation => html`
                <div class="invitation-card pending">
                  <div class="invitation-header">
                    <div class="family-info">
                      <h4 class="family-name">${invitation.family_name}</h4>
                      <div class="invitation-details">
                        from <strong>${invitation.inviter_name}</strong> • ${this.formatDate(invitation.created_at)}
                      </div>
                    </div>
                    <div class="status-badge ${this.getStatusClass(invitation.status)}">
                      ${this.getStatusText(invitation.status)}
                    </div>
                  </div>

                  <div class="invitation-body">
                    <div class="relationship-info">
                      <strong>Relationship:</strong> ${invitation.relationship_to_admin}
                    </div>
                    
                    ${Array.isArray(invitation.message) && invitation.message.length > 0 && invitation.message[0] ? html`
                      <div class="invitation-message">
                        <strong>Message:</strong>
                        <p>"${invitation.message[0]}"</p>
                      </div>
                    ` : ''}
                  </div>

                  <div class="invitation-actions">
                    <button
                      class="accept-button"
                      @click=${() => this.processInvitation(invitation.id, true)}
                      ?disabled=${this.processingInvitations.has(invitation.id)}
                    >
                      ${this.processingInvitations.has(invitation.id) ? '⏳ Processing...' : '✅ Accept'}
                    </button>
                    <button
                      class="decline-button"
                      @click=${() => this.processInvitation(invitation.id, false)}
                      ?disabled=${this.processingInvitations.has(invitation.id)}
                    >
                      ${this.processingInvitations.has(invitation.id) ? '⏳ Processing...' : '❌ Decline'}
                    </button>
                  </div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        ${processedInvitations.length > 0 ? html`
          <div class="section">
            <h3 class="section-title">📋 Processed Invitations (${processedInvitations.length})</h3>
            <div class="invitations-grid">
              ${processedInvitations.map(invitation => html`
                <div class="invitation-card processed">
                  <div class="invitation-header">
                    <div class="family-info">
                      <h4 class="family-name">${invitation.family_name}</h4>
                      <div class="invitation-details">
                        from <strong>${invitation.inviter_name}</strong> • ${this.formatDate(invitation.created_at)}
                      </div>
                    </div>
                    <div class="status-badge ${this.getStatusClass(invitation.status)}">
                      ${this.getStatusText(invitation.status)}
                    </div>
                  </div>

                  <div class="invitation-body">
                    <div class="relationship-info">
                      <strong>Relationship:</strong> ${invitation.relationship_to_admin}
                    </div>
                    
                    ${Array.isArray(invitation.message) && invitation.message.length > 0 && invitation.message[0] ? html`
                      <div class="invitation-message">
                        <strong>Message:</strong>
                        <p>"${invitation.message[0]}"</p>
                      </div>
                    ` : ''}
                  </div>

                  ${'Accepted' in invitation.status ? html`
                    <div class="invitation-actions">
                      <button
                        class="view-family-button"
                        @click=${() => this.handleViewFamily(invitation.family_id)}
                      >
                        👥 View Family
                      </button>
                    </div>
                  ` : ''}
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        ${this.invitations.length === 0 ? html`
          <div class="no-invitations">
            <div class="no-invitations-icon">📨</div>
            <h3>No Family Invitations</h3>
            <p>
              You don't have any family invitations yet.<br>
              When family admins invite you to join their families, the invitations will appear here.
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }
}