
use candid::{CandidType, Principal};
use ic_cdk::api;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use ic_stable_structures::storable::{Bound, Storable};
use std::borrow::Cow;

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

impl Storable for UserProfile {
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
}

#[init]
fn init() {
    ic_cdk::println!("Family tree backend initialized");
}

#[update]
fn create_profile(request: CreateProfileRequest) -> Result<UserProfile, String> {
    let caller = api::caller();
    
    if caller == Principal::anonymous() {
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
    
    if caller == Principal::anonymous() {
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
    
    if caller == Principal::anonymous() {
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