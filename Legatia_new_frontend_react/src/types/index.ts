import { Principal } from '@dfinity/principal';

export interface UserProfile {
  id: string;
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
  is_visible: boolean;
  created_at: bigint;
  updated_at: bigint;
}

export interface CreateFamilyRequest {
  name: string;
  description: string;
  is_visible?: [boolean] | [];
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

// Ghost Profile Claiming System Types
export interface GhostProfileMatch {
  family_id: string;
  member_id: string;
  family_name: string;
  ghost_profile_name: string;
  similarity_score: number;
}

export interface ClaimRequest {
  id: string;
  requester: Principal;
  family_id: string;
  member_id: string;
  requester_profile: UserProfile;
  ghost_member: FamilyMember;
  created_at: bigint;
  status: ClaimStatus;
}

export type ClaimStatus = 
  | { Pending: null }
  | { Approved: null }
  | { Rejected: null }
  | { Expired: null };

export interface ProcessClaimRequest {
  claim_id: string;
  approve: boolean;
  admin_message?: [string] | [];
}

export type GhostProfileMatchResult = { Ok: GhostProfileMatch[] } | { Err: string };
export type ClaimRequestResult = { Ok: ClaimRequest } | { Err: string };
export type ClaimRequestsResult = { Ok: ClaimRequest[] } | { Err: string };
export type ProfileWithGhostResult = { Ok: [UserProfile, GhostProfileMatch[]] } | { Err: string };

export interface BackendActor {
  create_profile: (request: CreateProfileRequest) => Promise<ProfileResult>;
  update_profile: (request: UpdateProfileRequest) => Promise<ProfileResult>;
  get_profile: () => Promise<ProfileResult>;
  create_profile_with_ghost_check: (request: CreateProfileRequest) => Promise<ProfileWithGhostResult>;
  update_profile_with_ghost_check: (request: UpdateProfileRequest) => Promise<ProfileWithGhostResult>;
  whoami: () => Promise<Principal>;
  
  create_family: (request: CreateFamilyRequest) => Promise<FamilyResult>;
  get_user_families: () => Promise<FamilyListResult>;
  get_family: (family_id: string) => Promise<FamilyResult>;
  
  add_family_member: (request: AddFamilyMemberRequest) => Promise<FamilyMemberResult>;
  remove_family_member: (family_id: string, member_id: string) => Promise<StringResult>;
  
  add_member_event: (request: AddEventRequest) => Promise<FamilyEventResult>;
  get_member_events_chronological: (family_id: string, member_id: string) => Promise<FamilyEventsResult>;
  
  toggle_family_visibility: (family_id: string, is_visible: boolean) => Promise<StringResult>;
  
  find_matching_ghost_profiles: () => Promise<GhostProfileMatchResult>;
  submit_ghost_profile_claim: (family_id: string, member_id: string) => Promise<ClaimRequestResult>;
  get_pending_claims_for_admin: () => Promise<ClaimRequestsResult>;
  process_ghost_profile_claim: (request: ProcessClaimRequest) => Promise<StringResult>;
  get_my_claim_requests: () => Promise<ClaimRequestsResult>;
  
  // User search and invitation functions
  search_users: (query: string) => Promise<UserSearchResult>;
  send_family_invitation: (request: SendInvitationRequest) => Promise<StringResult>;
  process_family_invitation: (request: ProcessInvitationRequest) => Promise<StringResult>;
  get_my_invitations: () => Promise<FamilyInvitationsResult>;
  get_sent_invitations: () => Promise<FamilyInvitationsResult>;
  
  // Notification functions
  get_my_notifications: () => Promise<NotificationsResult>;
  get_unread_notification_count: () => Promise<{ Ok: bigint } | { Err: string }>;
  mark_notification_read: (notification_id: string) => Promise<StringResult>;
  mark_all_notifications_read: () => Promise<StringResult>;
}

// User Search Types
export interface UserSearchMatch {
  id: string;
  full_name: string;
  surname_at_birth: string;
  user_principal: Principal;
}

export type UserSearchResult = { Ok: UserSearchMatch[] } | { Err: string };

// Family Invitation Types
export interface FamilyInvitation {
  id: string;
  family_id: string;
  family_name: string;
  inviter: Principal;
  inviter_name: string;
  invitee: Principal;
  invitee_id: string;
  message?: [string] | [];
  created_at: bigint;
  status: InvitationStatus;
  relationship_to_admin: string;
}

export type InvitationStatus = { Pending: null } | { Accepted: null } | { Declined: null } | { Expired: null };

export interface SendInvitationRequest {
  user_id: string;
  family_id: string;
  message?: [string] | [];
  relationship_to_admin: string;
}

export interface ProcessInvitationRequest {
  invitation_id: string;
  accept: boolean;
}

export type FamilyInvitationsResult = { Ok: FamilyInvitation[] } | { Err: string };

// Notification Types
export interface Notification {
  id: string;
  recipient: Principal;
  title: string;
  message: string;
  notification_type: NotificationType;
  created_at: bigint;
  read: boolean;
  action_url?: [string] | [];
  metadata?: [string] | [];
}

export type NotificationType = { FamilyInvitation: null } | { GhostProfileClaim: null } | { FamilyUpdate: null } | { SystemAlert: null };

export type NotificationsResult = { Ok: Notification[] } | { Err: string };

// React-specific types
export type ViewType = 'loading' | 'login' | 'create-profile' | 'profile' | 'edit-profile' | 'families' | 'family-detail' | 'create-family' | 'add-member' | 'add-event' | 'ghost-matches' | 'claim-requests' | 'admin-claims' | 'user-search' | 'send-invitation' | 'my-invitations' | 'notifications' | 'error';