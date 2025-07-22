import { html, TemplateResult } from 'lit-html';
import { Family, FamilyMember, FamilyEvent, BackendActor } from '../types';
import { getBackendActor } from '../auth';

export class FamilyDetail {
  private family: Family;
  private onBack: () => void;
  private onAddMember: (familyId: string) => void;
  private onAddEvent: (familyId: string, memberId: string) => void;
  private onFamilyUpdate: (family: Family) => void;

  constructor(
    family: Family,
    onBack: () => void,
    onAddMember: (familyId: string) => void,
    onAddEvent: (familyId: string, memberId: string) => void,
    onFamilyUpdate: (family: Family) => void
  ) {
    this.family = family;
    this.onBack = onBack;
    this.onAddMember = onAddMember;
    this.onAddEvent = onAddEvent;
    this.onFamilyUpdate = onFamilyUpdate;
  }

  private formatTimestamp(timestamp: bigint): string {
    const milliseconds = Number(timestamp) / 1000000;
    return new Date(milliseconds).toLocaleDateString();
  }

  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  private async toggleVisibility(): Promise<void> {
    try {
      const actor = await getBackendActor();
      const result = await actor.toggle_family_visibility(this.family.id, !this.family.is_visible);
      
      if ('Ok' in result) {
        // Update the family object with new visibility status
        const updatedFamily = { ...this.family, is_visible: !this.family.is_visible };
        this.family = updatedFamily;
        this.onFamilyUpdate(updatedFamily);
        
        // Show success message (could be handled by parent component)
        console.log(result.Ok);
      } else {
        console.error('Failed to toggle visibility:', result.Err);
        alert('Failed to toggle visibility: ' + result.Err);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Error toggling visibility: ' + error);
    }
  }

  private renderMemberEvents(member: FamilyMember): TemplateResult {
    if (member.events.length === 0) {
      return html`
        <div class="no-events">
          <p>No events recorded yet.</p>
          <button @click=${() => this.onAddEvent(this.family.id, member.id)} class="btn-small">
            Add First Event
          </button>
        </div>
      `;
    }

    const sortedEvents = [...member.events].sort((a, b) => a.event_date.localeCompare(b.event_date));

    return html`
      <div class="member-events">
        <div class="events-header">
          <h4>Life Events</h4>
          <button @click=${() => this.onAddEvent(this.family.id, member.id)} class="btn-small">
            Add Event
          </button>
        </div>
        <div class="events-timeline">
          ${sortedEvents.map(event => html`
            <div class="timeline-event">
              <div class="event-date">${this.formatDate(event.event_date)}</div>
              <div class="event-content">
                <h5>${event.title}</h5>
                <p>${event.description}</p>
                <span class="event-type">${event.event_type}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderMember(member: FamilyMember): TemplateResult {
    return html`
      <div class="family-member">
        <div class="member-header">
          <h3>${member.full_name}</h3>
          <span class="relationship">${member.relationship_to_admin}</span>
        </div>
        
        <div class="member-info">
          <div class="member-details">
            <p><strong>Surname at Birth:</strong> ${member.surname_at_birth}</p>
            <p><strong>Sex:</strong> ${member.sex}</p>
            ${member.birthday && member.birthday.length > 0 ? 
              html`<p><strong>Birthday:</strong> ${this.formatDate(member.birthday[0] || '')}</p>` : 
              ''
            }
            ${member.birth_city && member.birth_city.length > 0 ? 
              html`<p><strong>Birth City:</strong> ${member.birth_city[0] || ''}</p>` : 
              ''
            }
            ${member.birth_country && member.birth_country.length > 0 ? 
              html`<p><strong>Birth Country:</strong> ${member.birth_country[0] || ''}</p>` : 
              ''
            }
            ${member.death_date && member.death_date.length > 0 ? 
              html`<p><strong>Death Date:</strong> ${this.formatDate(member.death_date[0] || '')}</p>` : 
              ''
            }
          </div>
          
          ${this.renderMemberEvents(member)}
        </div>
      </div>
    `;
  }

  render(): TemplateResult {
    const { family } = this;
    
    return html`
      <div class="family-detail">
        <div class="family-detail-header">
          <button @click=${this.onBack} class="btn-back">← Back to Families</button>
          <h2>${family.name}</h2>
          <button @click=${() => this.onAddMember(family.id)} class="btn-primary">
            Add Family Member
          </button>
        </div>

        <div class="family-info">
          <p class="family-description">${family.description}</p>
          <div class="family-meta">
            <span>Created: ${this.formatTimestamp(family.created_at)}</span>
            ${family.updated_at !== family.created_at ? 
              html`<span>Updated: ${this.formatTimestamp(family.updated_at)}</span>` : 
              ''
            }
            <span>${family.members.length} members</span>
          </div>
          
          <div class="family-visibility">
            <div class="visibility-status">
              <span class="visibility-label">
                Ghost Profile Discovery: 
                <strong class="${family.is_visible ? 'visible' : 'hidden'}">
                  ${family.is_visible ? '👁️ Visible' : '🔒 Hidden'}
                </strong>
              </span>
              <button 
                class="visibility-toggle ${family.is_visible ? 'hide-btn' : 'show-btn'}"
                @click=${() => this.toggleVisibility()}
                title="${family.is_visible ? 'Hide from ghost profile matching' : 'Allow ghost profile matching'}"
              >
                ${family.is_visible ? '🔒 Hide Family' : '👁️ Show Family'}
              </button>
            </div>
            <small class="visibility-help">
              ${family.is_visible 
                ? 'Other users can discover and request to claim ghost profiles in this family.'
                : 'This family is hidden from ghost profile matching to prevent unwanted claim requests.'}
            </small>
          </div>
        </div>

        <div class="family-members">
          <h3>Family Members</h3>
          
          ${family.members.length === 0 ? html`
            <div class="empty-members">
              <p>No family members added yet.</p>
              <p>Start building your family tree by adding your first family member.</p>
              <button @click=${() => this.onAddMember(family.id)} class="btn-primary">
                Add First Member
              </button>
            </div>
          ` : html`
            <div class="members-list">
              ${family.members.map(member => this.renderMember(member))}
            </div>
          `}
        </div>
      </div>
    `;
  }
}