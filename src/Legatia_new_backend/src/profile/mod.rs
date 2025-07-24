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

    // Validate input fields
    if let Err(_) = crate::validation::validate_name(&request.full_name, "full_name") {
        return Err("Invalid full name format".to_string());
    }
    if let Err(_) = crate::validation::validate_name(&request.surname_at_birth, "surname_at_birth") {
        return Err("Invalid surname format".to_string());
    }
    if let Err(_) = crate::validation::validate_name(&request.birth_city, "birth_city") {
        return Err("Invalid birth city format".to_string());
    }
    if let Err(_) = crate::validation::validate_name(&request.birth_country, "birth_country") {
        return Err("Invalid birth country format".to_string());
    }

    let current_time = api::time();
    
    // Generate unique user ID
    let user_id = generate_unique_user_id(&request.full_name, &request.surname_at_birth);
    
    let profile = UserProfile {
        id: user_id,
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
        
        // Update search index
        crate::invitations::update_user_search_index(&profile, caller);
        
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
                
                // Update search index
                crate::invitations::update_user_search_index(&profile, caller);
                
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
    
    // Generate unique user ID
    let user_id = generate_unique_user_id(&request.full_name, &request.surname_at_birth);
    
    let profile = UserProfile {
        id: user_id,
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

// Helper functions
fn generate_unique_user_id(full_name: &str, surname_at_birth: &str) -> String {
    // Create a base ID from name and surname
    let normalized_name = full_name.to_lowercase().replace(" ", "_");
    let normalized_surname = surname_at_birth.to_lowercase().replace(" ", "_");
    let base_id = format!("{}_{}", normalized_name, normalized_surname);
    
    // Add timestamp to ensure uniqueness
    let timestamp = api::time();
    format!("{}_{}", base_id, timestamp)
}

// Internal helper functions for other modules
pub fn get_profile_internal(principal: Principal) -> Result<UserProfile, String> {
    PROFILES.with(|profiles| {
        profiles.borrow()
            .get(&principal)
            .ok_or("Profile not found".to_string())
    })
}

pub fn add_user_to_family(principal: Principal, family_id: String) -> Result<(), String> {
    use crate::storage::USER_FAMILIES;
    use crate::types::UserFamilyList;
    
    USER_FAMILIES.with(|user_families| {
        let mut user_families = user_families.borrow_mut();
        match user_families.get(&principal) {
            Some(mut families) => {
                if !families.0.contains(&family_id) {
                    families.0.push(family_id);
                    user_families.insert(principal, families);
                }
            }
            None => {
                let new_families = UserFamilyList(vec![family_id]);
                user_families.insert(principal, new_families);
            }
        }
    });
    Ok(())
}