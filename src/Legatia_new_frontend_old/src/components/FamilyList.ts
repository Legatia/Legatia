import { html, TemplateResult } from 'lit-html';
import { Family } from '../types';

export class FamilyList {
  private families: Family[];
  private onCreateFamily: () => void;
  private onViewFamily: (familyId: string) => void;

  constructor(
    families: Family[], 
    onCreateFamily: () => void, 
    onViewFamily: (familyId: string) => void
  ) {
    this.families = families;
    this.onCreateFamily = onCreateFamily;
    this.onViewFamily = onViewFamily;
  }

  private formatTimestamp(timestamp: bigint): string {
    const milliseconds = Number(timestamp) / 1000000;
    return new Date(milliseconds).toLocaleDateString();
  }

  render(): TemplateResult {
    return html`
      <div class="family-list">
        <div class="family-header">
          <h2>Your Families</h2>
          <button @click=${this.onCreateFamily} class="btn-primary">
            Create New Family
          </button>
        </div>

        ${this.families.length === 0 ? html`
          <div class="empty-state">
            <p>You haven't created any families yet.</p>
            <p>Start building your digital family tree by creating your first family.</p>
            <button @click=${this.onCreateFamily} class="btn-primary">
              Create Your First Family
            </button>
          </div>
        ` : html`
          <div class="family-grid">
            ${this.families.map(family => html`
              <div class="family-card" @click=${() => this.onViewFamily(family.id)}>
                <h3>${family.name}</h3>
                <p class="family-description">${family.description}</p>
                <div class="family-meta">
                  <span class="member-count">${family.members.length} members</span>
                  <span class="created-date">Created ${this.formatTimestamp(family.created_at)}</span>
                </div>
                <button class="view-family-btn">View Family →</button>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }
}