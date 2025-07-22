use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::storable::{Bound, Storable};
use std::borrow::Cow;

// Development mode - allows anonymous access for testing
pub const DEV_MODE: bool = true;

// Profile Types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserProfile {
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
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CreateFamilyRequest {
    pub name: String,
    pub description: String,
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

// Storage wrapper for Vec<String> to work around orphan rules
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct UserFamilyList(pub Vec<String>);

// Storable implementations
impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for Family {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
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