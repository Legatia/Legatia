use candid::Principal;
use ic_cdk::api;
use ic_cdk_macros::*;

use crate::types::{
    Family, FamilyMember, FamilyEvent, CreateFamilyRequest, AddFamilyMemberRequest, 
    AddEventRequest, DEV_MODE
};
use crate::storage::{PROFILES, FAMILIES, USER_FAMILIES, generate_id};

#[update]
pub fn create_family(request: CreateFamilyRequest) -> Result<Family, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    // Validate input fields
    if let Err(_) = crate::validation::validate_name(&request.name, "family_name") {
        return Err("Invalid family name format".to_string());
    }
    if let Err(_) = crate::validation::validate_description(&request.description) {
        return Err("Invalid description format".to_string());
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
        is_visible: request.is_visible.unwrap_or(true), // Default to visible if not specified
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
pub fn get_user_families() -> Result<Vec<Family>, String> {
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
pub fn get_family(family_id: String) -> Result<Family, String> {
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
                    // Check if user is a member of the family
                    let is_member = family.members.iter().any(|member| {
                        member.profile_principal == Some(caller)
                    });
                    
                    if is_member {
                        Ok(family)
                    } else {
                        Err("Access denied: You are not a member of this family".to_string())
                    }
                }
            }
            None => Err("Family not found".to_string()),
        }
    })
}

#[update]
pub fn add_family_member(request: AddFamilyMemberRequest) -> Result<FamilyMember, String> {
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
pub fn remove_family_member(family_id: String, member_id: String) -> Result<String, String> {
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

#[update]
pub fn add_member_event(request: AddEventRequest) -> Result<FamilyEvent, String> {
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
pub fn get_member_events_chronological(family_id: String, member_id: String) -> Result<Vec<FamilyEvent>, String> {
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

#[update]
pub fn toggle_family_visibility(family_id: String, is_visible: bool) -> Result<String, String> {
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
                    return Err("Only family admin can change visibility settings".to_string());
                }
                
                family.is_visible = is_visible;
                family.updated_at = api::time();
                families.insert(family_id, family);
                
                let status = if is_visible { "visible" } else { "hidden" };
                Ok(format!("Family visibility updated to {}", status))
            }
            None => Err("Family not found".to_string()),
        }
    })
}

// Internal helper functions for other modules
pub fn get_family_internal(family_id: &str) -> Result<Family, String> {
    FAMILIES.with(|families| {
        families.borrow()
            .get(&family_id.to_string())
            .ok_or("Family not found".to_string())
    })
}

pub fn update_family_internal(family: Family) -> Result<(), String> {
    FAMILIES.with(|families| {
        families.borrow_mut().insert(family.id.clone(), family);
        Ok(())
    })
}

pub fn generate_member_id() -> String {
    format!("member_{}", api::time())
}