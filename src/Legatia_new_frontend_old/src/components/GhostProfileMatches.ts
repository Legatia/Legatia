import { html, TemplateResult } from 'lit-html';
import type { GhostProfileMatch } from '../types';
import { getBackendActor } from '../auth';

export class GhostProfileMatches {
  private matches: GhostProfileMatch[];
  private onBack: () => void;
  private submittingClaim = false;
  private message = '';
  private messageType: 'success' | 'error' | '' = '';

  constructor(matches: GhostProfileMatch[], onBack: () => void) {
    this.matches = matches;
    this.onBack = onBack;
  }

  private async handleClaimProfile(match: GhostProfileMatch) {
    if (this.submittingClaim) return;

    this.submittingClaim = true;
    this.message = '';
    this.messageType = '';

    try {
      const actor = await getBackendActor();
      const result = await actor.submit_ghost_profile_claim(match.family_id, match.member_id);

      if ('Ok' in result) {
        this.message = `Claim request submitted successfully! The family admin will review your request.`;
        this.messageType = 'success';
        // Note: In a real implementation, we'd need a way to update the parent component
      } else {
        this.message = result.Err;
        this.messageType = 'error';
      }
    } catch (error) {
      this.message = `Error submitting claim: ${error}`;
      this.messageType = 'error';
    } finally {
      this.submittingClaim = false;
    }
  }

  private getSimilarityClass(score: number): string {
    return score >= 85 ? 'high-similarity' : 'medium-similarity';
  }

  private getSimilarityBadgeClass(score: number): string {
    return score >= 85 ? 'high-score' : 'medium-score';
  }

  private getSimilarityText(score: number): string {
    if (score >= 90) return 'Excellent Match';
    if (score >= 85) return 'Very Good Match';
    if (score >= 80) return 'Good Match';
    return 'Possible Match';
  }

  render(): TemplateResult {
    if (this.matches.length === 0) {
      return html`
        <div class="header">
          <h2>Ghost Profile Matches</h2>
          <p>Looking for potential matches to existing family profiles...</p>
        </div>

        <div class="no-matches">
          <div class="no-matches-icon">👻</div>
          <h3>No Matching Ghost Profiles Found</h3>
          <p>We couldn't find any existing family profiles that match your information.<br>
             This means you can start creating your own family trees!</p>
        </div>

        <button class="back-button" @click=${this.onBack}>
          ← Back to Profile
        </button>
      `;
    }

    return html`
      <div class="header">
        <h2>Potential Family Connections Found! 👨‍👩‍👧‍👦</h2>
        <p>We found ${this.matches.length} existing family profile(s) that might be you. 
           Review the matches below and claim any that belong to you.</p>
      </div>

      ${this.message ? html`
        <div class="message ${this.messageType}">
          ${this.message}
        </div>
      ` : ''}

      <div class="matches-container">
        ${this.matches.map(match => html`
          <div class="match-card ${this.getSimilarityClass(match.similarity_score)}">
            <div class="similarity-badge ${this.getSimilarityBadgeClass(match.similarity_score)}">
              ${match.similarity_score}% ${this.getSimilarityText(match.similarity_score)}
            </div>

            <div class="match-info">
              <div class="match-title">${match.ghost_profile_name}</div>
              <div class="match-details">
                <strong>Family:</strong> ${match.family_name}<br>
                <strong>Family ID:</strong> ${match.family_id}<br>
                <strong>Member ID:</strong> ${match.member_id}
              </div>
            </div>

            <div class="claim-section">
              <p><strong>Is this you?</strong> Claim this profile to join the family and connect with your relatives.</p>
              <button 
                class="claim-button"
                ?disabled=${this.submittingClaim}
                @click=${() => this.handleClaimProfile(match)}
              >
                ${this.submittingClaim ? 'Submitting...' : 'Claim This Profile'}
              </button>
            </div>
          </div>
        `)}
      </div>

      <button class="back-button" @click=${this.onBack}>
        ← Back to Profile
      </button>
    `;
  }
}