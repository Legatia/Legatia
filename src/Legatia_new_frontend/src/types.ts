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
  full_name?: [string] | [];
  surname_at_birth?: [string] | [];
  sex?: [string] | [];
  birthday?: [string] | [];
  birth_city?: [string] | [];
  birth_country?: [string] | [];
}

export interface FamilyEvent {
  id: string;
  member_id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: string;
  created_at: bigint;
  created_by: Principal;
}

export interface FamilyMember {
  id: string;
  profile_principal?: [Principal] | [];
  full_name: string;
  surname_at_birth: string;
  sex: string;
  birthday?: [string] | [];
  birth_city?: [string] | [];
  birth_country?: [string] | [];
  death_date?: [string] | [];
  relationship_to_admin: string;
  events: FamilyEvent[];
  created_at: bigint;
  created_by: Principal;
}

export interface Family {
  id: string;
  name: string;
  description: string;
  admin: Principal;
  members: FamilyMember[];
  created_at: bigint;
  updated_at: bigint;
}

export interface CreateFamilyRequest {
  name: string;
  description: string;
}

export interface AddFamilyMemberRequest {
  family_id: string;
  full_name: string;
  surname_at_birth: string;
  sex: string;
  birthday?: [string] | [];
  birth_city?: [string] | [];
  birth_country?: [string] | [];
  death_date?: [string] | [];
  relationship_to_admin: string;
}

export interface AddEventRequest {
  family_id: string;
  member_id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: string;
}

export type ProfileResult = { Ok: UserProfile } | { Err: string };
export type FamilyResult = { Ok: Family } | { Err: string };
export type FamilyListResult = { Ok: Family[] } | { Err: string };
export type FamilyMemberResult = { Ok: FamilyMember } | { Err: string };
export type FamilyEventResult = { Ok: FamilyEvent } | { Err: string };
export type FamilyEventsResult = { Ok: FamilyEvent[] } | { Err: string };
export type StringResult = { Ok: string } | { Err: string };

export interface BackendActor {
  create_profile: (request: CreateProfileRequest) => Promise<ProfileResult>;
  update_profile: (request: UpdateProfileRequest) => Promise<ProfileResult>;
  get_profile: () => Promise<ProfileResult>;
  whoami: () => Promise<Principal>;
  
  create_family: (request: CreateFamilyRequest) => Promise<FamilyResult>;
  get_user_families: () => Promise<FamilyListResult>;
  get_family: (family_id: string) => Promise<FamilyResult>;
  
  add_family_member: (request: AddFamilyMemberRequest) => Promise<FamilyMemberResult>;
  remove_family_member: (family_id: string, member_id: string) => Promise<StringResult>;
  
  add_member_event: (request: AddEventRequest) => Promise<FamilyEventResult>;
  get_member_events_chronological: (family_id: string, member_id: string) => Promise<FamilyEventsResult>;
}

export type ViewType = 'loading' | 'login' | 'create-profile' | 'profile' | 'edit-profile' | 'families' | 'family-detail' | 'create-family' | 'add-member' | 'add-event' | 'error';