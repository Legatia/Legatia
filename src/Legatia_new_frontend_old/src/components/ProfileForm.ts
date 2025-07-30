import { html, TemplateResult } from 'lit-html';
import { UserProfile, CreateProfileRequest, UpdateProfileRequest } from '../types';
import { DateInput } from './DateInput';

export class ProfileForm {
  private onSubmitCreate: ((data: CreateProfileRequest) => Promise<void>) | null = null;
  private onSubmitUpdate: ((data: UpdateProfileRequest) => Promise<void>) | null = null;
  private initialData: UserProfile | null;
  private isEdit: boolean;
  private birthday: string = '';

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
    this.birthday = initialData?.birthday || '';
    
    if (this.isEdit) {
      this.onSubmitUpdate = onSubmit as (data: UpdateProfileRequest) => Promise<void>;
    } else {
      this.onSubmitCreate = onSubmit as (data: CreateProfileRequest) => Promise<void>;
    }
  }

  private handleBirthdayChange = (value: string): void => {
    console.log('Birthday changed to:', value); // Debug log
    this.birthday = value;
  };

  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const profileData = {
      full_name: formData.get('full_name') as string,
      surname_at_birth: formData.get('surname_at_birth') as string,
      sex: formData.get('sex') as string,
      birthday: this.birthday,
      birth_city: formData.get('birth_city') as string,
      birth_country: formData.get('birth_country') as string
    };
    
    console.log('Submitting profile with birthday:', this.birthday); // Debug log

    if (this.isEdit && this.initialData && this.onSubmitUpdate) {
      // For updates, include all fields - changed fields as [value], unchanged as []
      const updateData: UpdateProfileRequest = {
        full_name: profileData.full_name !== (this.initialData.full_name || '') ? [profileData.full_name] : [],
        surname_at_birth: profileData.surname_at_birth !== (this.initialData.surname_at_birth || '') ? [profileData.surname_at_birth] : [],
        sex: profileData.sex !== (this.initialData.sex || '') ? [profileData.sex] : [],
        birthday: profileData.birthday !== (this.initialData.birthday || '') ? [profileData.birthday] : [],
        birth_city: profileData.birth_city !== (this.initialData.birth_city || '') ? [profileData.birth_city] : [],
        birth_country: profileData.birth_country !== (this.initialData.birth_country || '') ? [profileData.birth_country] : [],
      };
      
      console.log('Update data:', updateData);
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
            ${new DateInput('birthday', 'Birthday', this.birthday, true, this.handleBirthdayChange).render()}
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