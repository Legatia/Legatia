import { html, TemplateResult } from 'lit-html';
import { AddFamilyMemberRequest } from '../types';
import { DateInput } from './DateInput';

export class AddFamilyMemberForm {
  private familyId: string;
  private onSubmit: (data: AddFamilyMemberRequest) => Promise<void>;
  private onCancel: () => void;
  private birthday: string = '';
  private deathDate: string = '';

  constructor(
    familyId: string,
    onSubmit: (data: AddFamilyMemberRequest) => Promise<void>,
    onCancel: () => void
  ) {
    this.familyId = familyId;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
  }

  private handleBirthdayChange = (value: string): void => {
    this.birthday = value;
  };

  private handleDeathDateChange = (value: string): void => {
    this.deathDate = value;
  };

  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const memberData: AddFamilyMemberRequest = {
      family_id: this.familyId,
      full_name: formData.get('full_name') as string,
      surname_at_birth: formData.get('surname_at_birth') as string,
      sex: formData.get('sex') as string,
      birthday: this.birthday ? [this.birthday] : [],
      birth_city: formData.get('birth_city') ? [formData.get('birth_city') as string] : [],
      birth_country: formData.get('birth_country') ? [formData.get('birth_country') as string] : [],
      death_date: this.deathDate ? [this.deathDate] : [],
      relationship_to_admin: formData.get('relationship_to_admin') as string
    };

    await this.onSubmit(memberData);
  };

  render(): TemplateResult {
    return html`
      <div class="add-member-form">
        <h2>Add Family Member</h2>
        <form @submit=${this.handleSubmit}>
          <div class="form-row">
            <div class="form-group">
              <label for="full_name">Full Name:</label>
              <input 
                type="text" 
                id="full_name" 
                name="full_name" 
                required 
              />
            </div>

            <div class="form-group">
              <label for="surname_at_birth">Surname at Birth:</label>
              <input 
                type="text" 
                id="surname_at_birth" 
                name="surname_at_birth" 
                required 
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="sex">Sex:</label>
              <select id="sex" name="sex" required>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label for="relationship_to_admin">Relationship to You:</label>
              <select id="relationship_to_admin" name="relationship_to_admin" required>
                <option value="">Select...</option>
                <option value="self">Self</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="grandparent">Grandparent</option>
                <option value="grandchild">Grandchild</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              ${new DateInput('birthday', 'Birthday (optional)', this.birthday, false, this.handleBirthdayChange).render()}
            </div>

            <div class="form-group">
              ${new DateInput('death_date', 'Death Date (optional)', this.deathDate, false, this.handleDeathDateChange).render()}
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="birth_city">Birth City (optional):</label>
              <input 
                type="text" 
                id="birth_city" 
                name="birth_city" 
              />
            </div>

            <div class="form-group">
              <label for="birth_country">Birth Country (optional):</label>
              <input 
                type="text" 
                id="birth_country" 
                name="birth_country" 
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              Add Member
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