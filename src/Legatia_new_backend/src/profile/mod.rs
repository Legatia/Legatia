use candid::Principal;
use ic_cdk::api;
use ic_cdk_macros::*;

use crate::types::{UserProfile, CreateProfileRequest, UpdateProfileRequest, GhostProfileMatch, DEV_MODE};
use crate::storage::PROFILES;
use crate::ghost::find_matching_ghost_profiles;

#[update]
pub fn create_profile(request: CreateProfileRequest) -> Result<UserProfile, String> {
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
pub fn update_profile(request: UpdateProfileRequest) -> Result<UserProfile, String> {
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
pub fn get_profile() -> Result<UserProfile, String> {
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

// Create profile and return both profile and potential ghost matches
#[update]
pub fn create_profile_with_ghost_check(request: CreateProfileRequest) -> Result<(UserProfile, Vec<GhostProfileMatch>), String> {
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

    // Check if profile already exists
    PROFILES.with(|profiles| {
        let mut profiles = profiles.borrow_mut();
        if profiles.contains_key(&caller) {
            return Err("Profile already exists".to_string());
        }
        profiles.insert(caller, profile.clone());
        Ok(())
    })?;

    // Find matching ghost profiles after creating the profile
    let ghost_matches = find_matching_ghost_profiles().unwrap_or_default();

    Ok((profile, ghost_matches))
}

// Update profile and return potential ghost matches
#[update] 
pub fn update_profile_with_ghost_check(request: UpdateProfileRequest) -> Result<(UserProfile, Vec<GhostProfileMatch>), String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    let current_time = api::time();

    let updated_profile = PROFILES.with(|profiles| {
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
    })?;

    // Find matching ghost profiles after updating the profile
    let ghost_matches = find_matching_ghost_profiles().unwrap_or_default();

    Ok((updated_profile, ghost_matches))
}