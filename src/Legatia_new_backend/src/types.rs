use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::storable::{Bound, Storable};
use std::borrow::Cow;

// Development mode - allows anonymous access for testing
pub const DEV_MODE: bool = true;

// Profile Types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct UserProfile {
    pub id: String, // Unique user ID (e.g., "user_001", "john_doe_1990")
    pub full_name: String,
    pub surname_at_birth: String,
    pub sex: String,
    pub birthday: String,
    pub birth_city: String,
    pub birth_country: String,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateProfileRequest {
    pub full_name: String,
    pub surname_at_birth: String,
    pub sex: String,
    pub birthday: String,
    pub birth_city: String,
    pub birth_country: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateProfileRequest {
    pub full_name: Option<String>,
    pub surname_at_birth: Option<String>,
    pub sex: Option<String>,
    pub birthday: Option<String>,
    pub birth_city: Option<String>,
    pub birth_country: Option<String>,
}

// Family Types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FamilyEvent {
    pub id: String,
    pub member_id: String,
    pub title: String,
    pub description: String,
    pub event_date: String, // ISO date string
    pub event_type: String, // "birth", "marriage", "death", "education", "achievement", "other"
    pub created_at: u64,
    pub created_by: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FamilyMember {
    pub id: String,
    pub profile_principal: Option<Principal>, // Link to UserProfile if they have an account
    pub full_name: String,
    pub surname_at_birth: String,
    pub sex: String,
    pub birthday: Option<String>,
    pub birth_city: Option<String>,
    pub birth_country: Option<String>,
    pub death_date: Option<String>,
    pub relationship_to_admin: String, // "self", "spouse", "child", "parent", "sibling", "other"
    pub events: Vec<FamilyEvent>,
    pub created_at: u64,
    pub created_by: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Family {
    pub id: String,
    pub name: String,
    pub description: String,
    pub admin: Principal,
    pub members: Vec<FamilyMember>,
    pub is_visible: bool, // Controls if family is visible for ghost profile matching
    pub created_at: u64,
    pub updated_at: u64,
}

impl Default for Family {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            description: String::new(),
            admin: Principal::anonymous(),
            members: Vec::new(),
            is_visible: false,
            created_at: 0,
            updated_at: 0,
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateFamilyRequest {
    pub name: String,
    pub description: String,
    pub is_visible: Option<bool>, // Optional visibility setting, defaults to true
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AddFamilyMemberRequest {
    pub family_id: String,
    pub full_name: String,
    pub surname_at_birth: String,
    pub sex: String,
    pub birthday: Option<String>,
    pub birth_city: Option<String>,
    pub birth_country: Option<String>,
    pub death_date: Option<String>,
    pub relationship_to_admin: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct AddEventRequest {
    pub family_id: String,
    pub member_id: String,
    pub title: String,
    pub description: String,
    pub event_date: String,
    pub event_type: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateFamilyMemberRequest {
    pub family_id: String,
    pub member_id: String,
    pub full_name: Option<String>,
    pub surname_at_birth: Option<String>,
    pub sex: Option<String>,
    pub birthday: Option<String>,
    pub birth_city: Option<String>,
    pub birth_country: Option<String>,
    pub death_date: Option<String>,
    pub relationship_to_admin: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UpdateEventRequest {
    pub family_id: String,
    pub member_id: String,
    pub event_id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_date: Option<String>,
    pub event_type: Option<String>,
}

// Storage wrapper for Vec<String> to work around orphan rules
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct UserFamilyList(pub Vec<String>);

// Ghost Profile Claiming System
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GhostProfileMatch {
    pub family_id: String,
    pub member_id: String,
    pub family_name: String,
    pub ghost_profile_name: String,
    pub similarity_score: u8, // 0-100, how closely the profiles match
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ClaimRequest {
    pub id: String,
    pub requester: Principal,
    pub family_id: String,
    pub member_id: String,
    pub requester_profile: UserProfile,
    pub ghost_member: FamilyMember,
    pub created_at: u64,
    pub status: ClaimStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum ClaimStatus {
    Pending,
    Approved,
    Rejected,
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ProcessClaimRequest {
    pub claim_id: String,
    pub approve: bool,
    pub admin_message: Option<String>,
}

// Family Invitation Types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FamilyInvitation {
    pub id: String,
    pub family_id: String,
    pub family_name: String,
    pub inviter: Principal, // Family admin who sent the invitation
    pub inviter_name: String,
    pub invitee: Principal, // User being invited
    pub invitee_id: String, // User ID for reference
    pub message: Option<String>,
    pub created_at: u64,
    pub status: InvitationStatus,
    pub relationship_to_admin: String, // How they relate to the family admin
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum InvitationStatus {
    Pending,
    Accepted,
    Declined,
    Expired,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SendInvitationRequest {
    pub user_id: String, // Target user's unique ID
    pub family_id: String,
    pub message: Option<String>,
    pub relationship_to_admin: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ProcessInvitationRequest {
    pub invitation_id: String,
    pub accept: bool,
}

// User Search Types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserSearchResult {
    pub id: String,
    pub full_name: String,
    pub surname_at_birth: String,
    pub user_principal: Principal,
}

// Unified Notification Types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Notification {
    pub id: String,
    pub recipient: Principal,
    pub title: String,
    pub message: String,
    pub notification_type: NotificationType,
    pub created_at: u64,
    pub read: bool,
    pub action_url: Option<String>, // URL for frontend navigation
    pub metadata: Option<String>, // JSON metadata for specific actions
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum NotificationType {
    FamilyInvitation,
    GhostProfileClaim,
    FamilyUpdate,
    SystemAlert,
}

// Storable implementations
impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        match candid::encode_one(self) {
            Ok(bytes) => Cow::Owned(bytes),
            Err(_) => {
                // Log error and return empty bytes as fallback
                ic_cdk::println!("Failed to serialize UserProfile");
                Cow::Owned(vec![])
            }
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match candid::decode_one(&bytes) {
            Ok(profile) => profile,
            Err(_) => {
                // Log error and return default profile as fallback
                ic_cdk::println!("Failed to deserialize UserProfile, using default");
                UserProfile::default()
            }
        }
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for Family {
    fn to_bytes(&self) -> Cow<[u8]> {
        match candid::encode_one(self) {
            Ok(bytes) => Cow::Owned(bytes),
            Err(_) => {
                // Log error and return empty bytes as fallback
                ic_cdk::println!("Failed to serialize Family");
                Cow::Owned(vec![])
            }
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match candid::decode_one(&bytes) {
            Ok(family) => family,
            Err(_) => {
                // Log error and return default family as fallback
                ic_cdk::println!("Failed to deserialize Family, using default");
                Family::default()
            }
        }
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for UserFamilyList {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for ClaimRequest {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for FamilyInvitation {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for Notification {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for UserSearchResult {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for InvitationStatus {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}