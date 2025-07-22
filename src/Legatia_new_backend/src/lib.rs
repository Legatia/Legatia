
use candid::{CandidType, Principal};
use ic_cdk::api;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use ic_stable_structures::storable::{Bound, Storable};
use std::borrow::Cow;

// Development mode - allows anonymous access for testing
const DEV_MODE: bool = true;

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

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default)]
pub struct UserFamilyList(pub Vec<String>);

impl Storable for UserFamilyList {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static PROFILES: RefCell<StableBTreeMap<Principal, UserProfile, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static FAMILIES: RefCell<StableBTreeMap<String, Family, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static USER_FAMILIES: RefCell<StableBTreeMap<Principal, UserFamilyList, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );
}

#[init]
fn init() {
    ic_cdk::println!("Family tree backend initialized");
}

#[update]
fn create_profile(request: CreateProfileRequest) -> Result<UserProfile, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    let current_time = api::time();
    
    let profile = UserProfile {
        full_name: request.full_name,
        surname_at_birth: request.surname_at_birth,
        sex: request.sex,
        birthday: request.birthday,
        birth_city: request.birth_city,
        birth_country: request.birth_country,
        created_at: current_time,
        updated_at: current_time,
    };

    PROFILES.with(|profiles| {
        let mut profiles = profiles.borrow_mut();
        if profiles.contains_key(&caller) {
            return Err("Profile already exists".to_string());
        }
        profiles.insert(caller, profile.clone());
        Ok(profile)
    })
}

#[update]
fn update_profile(request: UpdateProfileRequest) -> Result<UserProfile, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    let current_time = api::time();

    PROFILES.with(|profiles| {
        let mut profiles = profiles.borrow_mut();
        match profiles.get(&caller) {
            Some(mut profile) => {
                if let Some(full_name) = request.full_name {
                    profile.full_name = full_name;
                }
                if let Some(surname_at_birth) = request.surname_at_birth {
                    profile.surname_at_birth = surname_at_birth;
                }
                if let Some(sex) = request.sex {
                    profile.sex = sex;
                }
                if let Some(birthday) = request.birthday {
                    profile.birthday = birthday;
                }
                if let Some(birth_city) = request.birth_city {
                    profile.birth_city = birth_city;
                }
                if let Some(birth_country) = request.birth_country {
                    profile.birth_country = birth_country;
                }
                profile.updated_at = current_time;
                profiles.insert(caller, profile.clone());
                Ok(profile)
            }
            None => Err("Profile not found".to_string()),
        }
    })
}

#[query]
fn get_profile() -> Result<UserProfile, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    PROFILES.with(|profiles| {
        let profiles = profiles.borrow();
        match profiles.get(&caller) {
            Some(profile) => Ok(profile),
            None => Err("Profile not found".to_string()),
        }
    })
}

#[query]
fn whoami() -> Principal {
    api::caller()
}

// Helper function to generate unique IDs
fn generate_id() -> String {
    let timestamp = api::time().to_string();
    let caller = api::caller().to_string();
    format!("{}_{}", timestamp, &caller[..8])
}

// Family Management Functions
#[update]
fn create_family(request: CreateFamilyRequest) -> Result<Family, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    // Check if user has a profile
    PROFILES.with(|profiles| {
        let profiles = profiles.borrow();
        if !profiles.contains_key(&caller) {
            return Err("You must create a user profile before creating a family".to_string());
        }
        Ok(())
    })?;

    let current_time = api::time();
    let family_id = generate_id();
    
    let family = Family {
        id: family_id.clone(),
        name: request.name,
        description: request.description,
        admin: caller,
        members: Vec::new(),
        created_at: current_time,
        updated_at: current_time,
    };

    FAMILIES.with(|families| {
        let mut families = families.borrow_mut();
        families.insert(family_id.clone(), family.clone());
        
        // Add family to user's family list
        USER_FAMILIES.with(|user_families| {
            let mut user_families = user_families.borrow_mut();
            let mut user_family_list = user_families.get(&caller).unwrap_or_default();
            user_family_list.0.push(family_id);
            user_families.insert(caller, user_family_list);
        });
        
        Ok(family)
    })
}

#[query]
fn get_user_families() -> Result<Vec<Family>, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    USER_FAMILIES.with(|user_families| {
        let user_families = user_families.borrow();
        let family_ids = user_families.get(&caller).unwrap_or_default();
        
        let families: Vec<Family> = FAMILIES.with(|families| {
            let families = families.borrow();
            family_ids.0.iter()
                .filter_map(|id| families.get(id))
                .collect()
        });
        
        Ok(families)
    })
}

#[query]
fn get_family(family_id: String) -> Result<Family, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    FAMILIES.with(|families| {
        let families = families.borrow();
        match families.get(&family_id) {
            Some(family) => {
                // Check if user has access to this family (is admin or member)
                if family.admin == caller {
                    Ok(family)
                } else {
                    // TODO: Check if user is a member
                    Err("Access denied: You are not a member of this family".to_string())
                }
            }
            None => Err("Family not found".to_string()),
        }
    })
}

// Family Member Management Functions
#[update]
fn add_family_member(request: AddFamilyMemberRequest) -> Result<FamilyMember, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    let current_time = api::time();
    let member_id = generate_id();
    
    let member = FamilyMember {
        id: member_id.clone(),
        profile_principal: None, // Users can link their profile later
        full_name: request.full_name,
        surname_at_birth: request.surname_at_birth,
        sex: request.sex,
        birthday: request.birthday,
        birth_city: request.birth_city,
        birth_country: request.birth_country,
        death_date: request.death_date,
        relationship_to_admin: request.relationship_to_admin,
        events: Vec::new(),
        created_at: current_time,
        created_by: caller,
    };

    FAMILIES.with(|families| {
        let mut families = families.borrow_mut();
        match families.get(&request.family_id) {
            Some(mut family) => {
                // Check if caller is admin
                if family.admin != caller {
                    return Err("Only family admin can add members".to_string());
                }
                
                family.members.push(member.clone());
                family.updated_at = current_time;
                families.insert(request.family_id, family);
                Ok(member)
            }
            None => Err("Family not found".to_string()),
        }
    })
}

#[update]
fn remove_family_member(family_id: String, member_id: String) -> Result<String, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    FAMILIES.with(|families| {
        let mut families = families.borrow_mut();
        match families.get(&family_id) {
            Some(mut family) => {
                // Check if caller is admin
                if family.admin != caller {
                    return Err("Only family admin can remove members".to_string());
                }
                
                let initial_len = family.members.len();
                family.members.retain(|member| member.id != member_id);
                
                if family.members.len() < initial_len {
                    family.updated_at = api::time();
                    families.insert(family_id, family);
                    Ok("Member removed successfully".to_string())
                } else {
                    Err("Member not found".to_string())
                }
            }
            None => Err("Family not found".to_string()),
        }
    })
}

// Chronicle Events System
#[update]
fn add_member_event(request: AddEventRequest) -> Result<FamilyEvent, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    let current_time = api::time();
    let event_id = generate_id();
    
    let event = FamilyEvent {
        id: event_id.clone(),
        member_id: request.member_id.clone(),
        title: request.title,
        description: request.description,
        event_date: request.event_date,
        event_type: request.event_type,
        created_at: current_time,
        created_by: caller,
    };

    FAMILIES.with(|families| {
        let mut families = families.borrow_mut();
        match families.get(&request.family_id) {
            Some(mut family) => {
                // Check if caller is admin
                if family.admin != caller {
                    return Err("Only family admin can add events".to_string());
                }
                
                // Find the member and add the event
                if let Some(member) = family.members.iter_mut().find(|m| m.id == request.member_id) {
                    member.events.push(event.clone());
                    
                    // Sort events by date for chronological order
                    member.events.sort_by(|a, b| a.event_date.cmp(&b.event_date));
                    
                    family.updated_at = current_time;
                    families.insert(request.family_id, family);
                    Ok(event)
                } else {
                    Err("Member not found in family".to_string())
                }
            }
            None => Err("Family not found".to_string()),
        }
    })
}

#[query]
fn get_member_events_chronological(family_id: String, member_id: String) -> Result<Vec<FamilyEvent>, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    FAMILIES.with(|families| {
        let families = families.borrow();
        match families.get(&family_id) {
            Some(family) => {
                // Check if user has access to this family
                if family.admin != caller {
                    return Err("Access denied: You are not a member of this family".to_string());
                }
                
                // Find the member and return their events
                if let Some(member) = family.members.iter().find(|m| m.id == member_id) {
                    let mut events = member.events.clone();
                    events.sort_by(|a, b| a.event_date.cmp(&b.event_date));
                    Ok(events)
                } else {
                    Err("Member not found in family".to_string())
                }
            }
            None => Err("Family not found".to_string()),
        }
    })
}