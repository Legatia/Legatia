import { html, TemplateResult } from 'lit-html';
import { AddEventRequest } from '../types';

export class AddEventForm {
  private familyId: string;
  private memberId: string;
  private memberName: string;
  private onSubmit: (data: AddEventRequest) => Promise<void>;
  private onCancel: () => void;

  constructor(
    familyId: string,
    memberId: string,
    memberName: string,
    onSubmit: (data: AddEventRequest) => Promise<void>,
    onCancel: () => void
  ) {
    this.familyId = familyId;
    this.memberId = memberId;
    this.memberName = memberName;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
  }

  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const eventData: AddEventRequest = {
      family_id: this.familyId,
      member_id: this.memberId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      event_date: formData.get('event_date') as string,
      event_type: formData.get('event_type') as string
    };

    await this.onSubmit(eventData);
  };

  render(): TemplateResult {
    return html`
      <div class="add-event-form">
        <h2>Add Event for ${this.memberName}</h2>
        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="title">Event Title:</label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              placeholder="e.g., Birth, Marriage, Graduation"
              required 
            />
          </div>

          <div class="form-group">
            <label for="event_type">Event Type:</label>
            <select id="event_type" name="event_type" required>
              <option value="">Select...</option>
              <option value="birth">Birth</option>
              <option value="marriage">Marriage</option>
              <option value="death">Death</option>
              <option value="education">Education</option>
              <option value="achievement">Achievement</option>
              <option value="travel">Travel</option>
              <option value="career">Career</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="event_date">Event Date:</label>
            <input 
              type="date" 
              id="event_date" 
              name="event_date" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="description">Description:</label>
            <textarea 
              id="description" 
              name="description" 
              rows="4"
              placeholder="Describe the event in detail..."
              required
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              Add Event
            </button>
            <button type="button" @click=${this.onCancel} class="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;
  }
}