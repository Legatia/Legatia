import { html, TemplateResult } from 'lit-html';
import { CreateFamilyRequest } from '../types';

export class FamilyCreateForm {
  private onSubmit: (data: CreateFamilyRequest) => Promise<void>;
  private onCancel: () => void;

  constructor(
    onSubmit: (data: CreateFamilyRequest) => Promise<void>,
    onCancel: () => void
  ) {
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
  }

  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const familyData: CreateFamilyRequest = {
      name: formData.get('name') as string,
      description: formData.get('description') as string
    };

    await this.onSubmit(familyData);
  };

  render(): TemplateResult {
    return html`
      <div class="family-create-form">
        <h2>Create New Family</h2>
        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="name">Family Name:</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              placeholder="e.g., Smith Family"
              required 
            />
          </div>

          <div class="form-group">
            <label for="description">Family Description:</label>
            <textarea 
              id="description" 
              name="description" 
              rows="4"
              placeholder="Tell the story of your family..."
              required
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              Create Family
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