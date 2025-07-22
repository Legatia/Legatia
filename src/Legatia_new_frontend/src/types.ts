import { Principal } from '@dfinity/principal';

export interface UserProfile {
  full_name: string;
  surname_at_birth: string;
  sex: string;
  birthday: string;
  birth_city: string;
  birth_country: string;
  created_at: bigint;
  updated_at: bigint;
}

export interface CreateProfileRequest {
  full_name: string;
  surname_at_birth: string;
  sex: string;
  birthday: string;
  birth_city: string;
  birth_country: string;
}

export interface UpdateProfileRequest {
  full_name?: [string];
  surname_at_birth?: [string];
  sex?: [string];
  birthday?: [string];
  birth_city?: [string];
  birth_country?: [string];
}

export type ProfileResult = { Ok: UserProfile } | { Err: string };

export interface BackendActor {
  create_profile: (request: CreateProfileRequest) => Promise<ProfileResult>;
  update_profile: (request: UpdateProfileRequest) => Promise<ProfileResult>;
  get_profile: () => Promise<ProfileResult>;
  whoami: () => Promise<Principal>;
}

export type ViewType = 'loading' | 'login' | 'create-profile' | 'profile' | 'edit-profile' | 'error';