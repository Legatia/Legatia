import { html, TemplateResult } from 'lit-html';
import { UserProfile, CreateProfileRequest, UpdateProfileRequest } from '../types';

export class ProfileForm {
  private onSubmitCreate: ((data: CreateProfileRequest) => Promise<void>) | null = null;
  private onSubmitUpdate: ((data: UpdateProfileRequest) => Promise<void>) | null = null;
  private initialData: UserProfile | null;
  private isEdit: boolean;

  constructor(
    onSubmit: (data: CreateProfileRequest) => Promise<void>,
    initialData?: UserProfile | null
  );
  constructor(
    onSubmit: (data: UpdateProfileRequest) => Promise<void>,
    initialData: UserProfile
  );
  constructor(
    onSubmit: ((data: CreateProfileRequest) => Promise<void>) | ((data: UpdateProfileRequest) => Promise<void>),
    initialData: UserProfile | null = null
  ) {
    this.initialData = initialData;
    this.isEdit = !!initialData;
    
    if (this.isEdit) {
      this.onSubmitUpdate = onSubmit as (data: UpdateProfileRequest) => Promise<void>;
    } else {
      this.onSubmitCreate = onSubmit as (data: CreateProfileRequest) => Promise<void>;
    }
  }

  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const profileData = {
      full_name: formData.get('full_name') as string,
      surname_at_birth: formData.get('surname_at_birth') as string,
      sex: formData.get('sex') as string,
      birthday: formData.get('birthday') as string,
      birth_city: formData.get('birth_city') as string,
      birth_country: formData.get('birth_country') as string
    };

    if (this.isEdit && this.initialData && this.onSubmitUpdate) {
      // For updates, only include changed fields
      const updateData: UpdateProfileRequest = {};
      Object.keys(profileData).forEach(key => {
        const fieldKey = key as keyof CreateProfileRequest;
        const currentValue = profileData[fieldKey];
        const initialValue = this.initialData![fieldKey] || '';
        
        if (currentValue !== initialValue) {
          (updateData as any)[fieldKey] = [currentValue]; // Wrap in array for Optional<String>
        }
      });
      await this.onSubmitUpdate(updateData);
    } else if (this.onSubmitCreate) {
      await this.onSubmitCreate(profileData as CreateProfileRequest);
    }
  };

  render(): TemplateResult {
    const data = this.initialData || {} as Partial<UserProfile>;
    
    return html`
      <div class="profile-form">
        <h2>${this.isEdit ? 'Edit Profile' : 'Create Profile'}</h2>
        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="full_name">Full Name:</label>
            <input 
              type="text" 
              id="full_name" 
              name="full_name" 
              value="${data.full_name || ''}" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="surname_at_birth">Surname at Birth:</label>
            <input 
              type="text" 
              id="surname_at_birth" 
              name="surname_at_birth" 
              value="${data.surname_at_birth || ''}" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="sex">Sex:</label>
            <select id="sex" name="sex" required>
              <option value="">Select...</option>
              <option value="Male" ?selected=${data.sex === 'Male'}>Male</option>
              <option value="Female" ?selected=${data.sex === 'Female'}>Female</option>
              <option value="Other" ?selected=${data.sex === 'Other'}>Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="birthday">Birthday:</label>
            <input 
              type="date" 
              id="birthday" 
              name="birthday" 
              value="${data.birthday || ''}" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="birth_city">Birth City:</label>
            <input 
              type="text" 
              id="birth_city" 
              name="birth_city" 
              value="${data.birth_city || ''}" 
              required 
            />
          </div>

          <div class="form-group">
            <label for="birth_country">Birth Country:</label>
            <input 
              type="text" 
              id="birth_country" 
              name="birth_country" 
              value="${data.birth_country || ''}" 
              required 
            />
          </div>

          <button type="submit" class="btn-primary">
            ${this.isEdit ? 'Update Profile' : 'Create Profile'}
          </button>
        </form>
      </div>
    `;
  }
}