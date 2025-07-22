import { html, TemplateResult } from 'lit-html';
import type { ClaimRequest, ProcessClaimRequest, ClaimStatus } from '../types';
import { getBackendActor } from '../auth';

export class ClaimRequestsManager {
  private mode: 'user' | 'admin';
  private onBack: () => void;
  private claimRequests: ClaimRequest[] = [];
  private loading = false;
  private processing = false;
  private message = '';
  private messageType: 'success' | 'error' | '' = '';

  constructor(mode: 'user' | 'admin', onBack: () => void) {
    this.mode = mode;
    this.onBack = onBack;
    this.loadClaimRequests();
  }

  private async loadClaimRequests() {
    this.loading = true;
    this.message = '';
    this.messageType = '';

    try {
      const actor = await getBackendActor();
      let result;
      
      if (this.mode === 'admin') {
        result = await actor.get_pending_claims_for_admin();
      } else {
        result = await actor.get_my_claim_requests();
      }

      if ('Ok' in result) {
        this.claimRequests = result.Ok;
      } else {
        this.message = result.Err;
        this.messageType = 'error';
      }
    } catch (error) {
      this.message = `Error loading claims: ${error}`;
      this.messageType = 'error';
    } finally {
      this.loading = false;
    }
  }

  private async processClaim(claimId: string, approve: boolean) {
    if (this.processing) return;

    this.processing = true;
    this.message = '';
    this.messageType = '';

    try {
      const actor = await getBackendActor();
      const request: ProcessClaimRequest = {
        claim_id: claimId,
        approve: approve,
        admin_message: []
      };

      const result = await actor.process_ghost_profile_claim(request);

      if ('Ok' in result) {
        this.message = result.Ok;
        this.messageType = 'success';
        // Reload the claims to reflect the change
        await this.loadClaimRequests();
      } else {
        this.message = result.Err;
        this.messageType = 'error';
      }
    } catch (error) {
      this.message = `Error processing claim: ${error}`;
      this.messageType = 'error';
    } finally {
      this.processing = false;
    }
  }

  private getStatusText(status: ClaimStatus): string {
    if ('Pending' in status) return 'pending';
    if ('Approved' in status) return 'approved';
    if ('Rejected' in status) return 'rejected';
    if ('Expired' in status) return 'expired';
    return 'unknown';
  }

  private formatTimestamp(timestamp: bigint): string {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleString();
  }

  render(): TemplateResult {
    if (this.loading) {
      return html`
        <div class="loading">
          <h2>Loading claim requests...</h2>
          <p>Please wait while we fetch the data.</p>
          <button class="back-button" @click=${this.onBack}>
            ← Back to Profile
          </button>
        </div>
      `;
    }

    const title = this.mode === 'admin' ? 'Family Admin - Claim Requests' : 'My Claim Requests';
    const emptyMessage = this.mode === 'admin' 
      ? 'No pending claim requests for your families.' 
      : 'You have not submitted any ghost profile claims yet.';

    return html`
      <div class="header">
        <h2>${title}</h2>
        <p>${this.mode === 'admin' 
          ? 'Review and approve/reject ghost profile claims for your families'
          : 'Track the status of your ghost profile claim requests'}</p>
      </div>

      <button class="back-button" @click=${this.onBack}>
        ← Back
      </button>

      ${this.message ? html`
        <div class="message ${this.messageType}">
          ${this.message}
        </div>
      ` : ''}

      ${this.claimRequests.length === 0 ? html`
        <div class="no-claims">
          <div class="no-claims-icon">📋</div>
          <h3>No Claim Requests</h3>
          <p>${emptyMessage}</p>
        </div>
      ` : html`
        <div class="claims-container">
          ${this.claimRequests.map(claim => html`
            <div class="claim-card">
              <div class="claim-header">
                <h3 class="claim-title">
                  ${claim.requester_profile.full_name} → ${claim.ghost_member.full_name}
                </h3>
                <div class="status-badge status-${this.getStatusText(claim.status)}">
                  ${this.getStatusText(claim.status)}
                </div>
              </div>

              <div class="claim-info">
                <div class="info-section">
                  <div class="info-title">👤 Requester Profile</div>
                  <div class="info-details">
                    <strong>Name:</strong> ${claim.requester_profile.full_name}<br>
                    <strong>Birth Name:</strong> ${claim.requester_profile.surname_at_birth}<br>
                    <strong>Sex:</strong> ${claim.requester_profile.sex}<br>
                    <strong>Birthday:</strong> ${claim.requester_profile.birthday}<br>
                    <strong>Birth Location:</strong> ${claim.requester_profile.birth_city}, ${claim.requester_profile.birth_country}
                  </div>
                </div>

                <div class="info-section">
                  <div class="info-title">👻 Ghost Profile</div>
                  <div class="info-details">
                    <strong>Name:</strong> ${claim.ghost_member.full_name}<br>
                    <strong>Birth Name:</strong> ${claim.ghost_member.surname_at_birth}<br>
                    <strong>Sex:</strong> ${claim.ghost_member.sex}<br>
                    <strong>Birthday:</strong> ${claim.ghost_member.birthday?.[0] || 'Not specified'}<br>
                    <strong>Birth Location:</strong> ${claim.ghost_member.birth_city?.[0] || 'N/A'}, ${claim.ghost_member.birth_country?.[0] || 'N/A'}<br>
                    <strong>Relationship:</strong> ${claim.ghost_member.relationship_to_admin}
                  </div>
                </div>
              </div>

              <div class="timestamp">
                Submitted: ${this.formatTimestamp(claim.created_at)}
              </div>

              ${this.mode === 'admin' && 'Pending' in claim.status ? html`
                <div class="claim-actions">
                  <button 
                    class="action-button approve-button"
                    ?disabled=${this.processing}
                    @click=${() => this.processClaim(claim.id, true)}
                  >
                    ✅ Approve Claim
                  </button>
                  <button 
                    class="action-button reject-button"
                    ?disabled=${this.processing}
                    @click=${() => this.processClaim(claim.id, false)}
                  >
                    ❌ Reject Claim
                  </button>
                </div>
              ` : ''}
            </div>
          `)}
        </div>
      `}
    `;
  }
}