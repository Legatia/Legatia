use candid::Principal;
use ic_cdk::api;
use ic_cdk_macros::*;

use crate::types::{
    UserProfile, FamilyMember, GhostProfileMatch, ClaimRequest, ClaimStatus, 
    ProcessClaimRequest, DEV_MODE
};
use crate::storage::{PROFILES, FAMILIES, USER_FAMILIES, CLAIM_REQUESTS, generate_id};

// Helper function to calculate similarity between profiles
fn calculate_similarity(user_profile: &UserProfile, ghost_member: &FamilyMember) -> u8 {
    let mut score = 0u8;
    let mut total_checks = 0u8;

    // Full name match (most important - 40 points)
    total_checks += 40;
    if user_profile.full_name.to_lowercase() == ghost_member.full_name.to_lowercase() {
        score += 40;
    } else if user_profile.full_name.to_lowercase().contains(&ghost_member.full_name.to_lowercase()) 
           || ghost_member.full_name.to_lowercase().contains(&user_profile.full_name.to_lowercase()) {
        score += 20; // Partial match
    }

    // Surname at birth match (important - 30 points)
    total_checks += 30;
    if user_profile.surname_at_birth.to_lowercase() == ghost_member.surname_at_birth.to_lowercase() {
        score += 30;
    }

    // Sex match (10 points)
    total_checks += 10;
    if user_profile.sex == ghost_member.sex {
        score += 10;
    }

    // Birthday match (20 points)
    total_checks += 20;
    if let Some(ghost_birthday) = &ghost_member.birthday {
        if !ghost_birthday.is_empty() && user_profile.birthday == *ghost_birthday {
            score += 20;
        } else if !ghost_birthday.is_empty() && user_profile.birthday.contains(&ghost_birthday[0..4]) {
            score += 10; // Year match only
        }
    }

    // Return percentage (score out of total possible)
    if total_checks == 0 {
        0
    } else {
        (score * 100) / total_checks
    }
}

// Find ghost profiles that match the user's profile
#[query]
pub fn find_matching_ghost_profiles() -> Result<Vec<GhostProfileMatch>, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    // Get user's profile
    let user_profile = PROFILES.with(|profiles| {
        let profiles = profiles.borrow();
        profiles.get(&caller)
    });

    let user_profile = match user_profile {
        Some(profile) => profile,
        None => return Err("User profile not found".to_string()),
    };

    let mut matches = Vec::new();

    // Search through all families for ghost profiles
    FAMILIES.with(|families| {
        let families = families.borrow();
        
        for (family_id, family) in families.iter() {
            // Skip families where user is already a member/admin
            if family.admin == caller {
                continue;
            }
            
            // Skip families that are not visible for ghost profile matching
            if !family.is_visible {
                continue;
            }
            
            // Look for ghost profiles (members without profile_principal)
            for member in &family.members {
                if member.profile_principal.is_none() {
                    let similarity = calculate_similarity(&user_profile, member);
                    
                    // Only include matches with high similarity (70% or above)
                    if similarity >= 70 {
                        matches.push(GhostProfileMatch {
                            family_id: family_id.clone(),
                            member_id: member.id.clone(),
                            family_name: family.name.clone(),
                            ghost_profile_name: member.full_name.clone(),
                            similarity_score: similarity,
                        });
                    }
                }
            }
        }
    });

    // Sort by similarity score (highest first)
    matches.sort_by(|a, b| b.similarity_score.cmp(&a.similarity_score));

    Ok(matches)
}

// Submit a claim request for a ghost profile
#[update]
pub fn submit_ghost_profile_claim(family_id: String, member_id: String) -> Result<ClaimRequest, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    // Get user's profile
    let user_profile = PROFILES.with(|profiles| {
        let profiles = profiles.borrow();
        profiles.get(&caller)
    });

    let user_profile = match user_profile {
        Some(profile) => profile,
        None => return Err("User profile not found".to_string()),
    };

    // Verify the ghost member exists and is actually a ghost profile
    let ghost_member = FAMILIES.with(|families| {
        let families = families.borrow();
        match families.get(&family_id) {
            Some(family) => {
                match family.members.iter().find(|m| m.id == member_id) {
                    Some(member) => {
                        if member.profile_principal.is_some() {
                            return Err("This profile is already claimed".to_string());
                        }
                        Ok(member.clone())
                    }
                    None => Err("Member not found in family".to_string()),
                }
            }
            None => Err("Family not found".to_string()),
        }
    })?;

    // Check if there's already a pending claim for this ghost profile
    let existing_claim = CLAIM_REQUESTS.with(|claims| {
        let claims = claims.borrow();
        for (_, claim) in claims.iter() {
            if claim.family_id == family_id 
                && claim.member_id == member_id 
                && matches!(claim.status, ClaimStatus::Pending) {
                return Some(claim);
            }
        }
        None
    });

    if existing_claim.is_some() {
        return Err("There is already a pending claim for this ghost profile".to_string());
    }

    // Create the claim request
    let claim_id = generate_id();
    let current_time = api::time();
    
    let claim_request = ClaimRequest {
        id: claim_id.clone(),
        requester: caller,
        family_id: family_id.clone(),
        member_id: member_id.clone(),
        requester_profile: user_profile,
        ghost_member: ghost_member,
        created_at: current_time,
        status: ClaimStatus::Pending,
    };

    // Store the claim request
    CLAIM_REQUESTS.with(|claims| {
        let mut claims = claims.borrow_mut();
        claims.insert(claim_id, claim_request.clone());
    });

    Ok(claim_request)
}

// Get pending claim requests for a family admin
#[query]
pub fn get_pending_claims_for_admin() -> Result<Vec<ClaimRequest>, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    let mut admin_claims = Vec::new();

    // Get all families where user is admin
    let admin_families = FAMILIES.with(|families| {
        let families = families.borrow();
        let mut family_ids = Vec::new();
        
        for (family_id, family) in families.iter() {
            if family.admin == caller {
                family_ids.push(family_id);
            }
        }
        
        family_ids
    });

    // Get pending claims for those families
    CLAIM_REQUESTS.with(|claims| {
        let claims = claims.borrow();
        
        for (_, claim) in claims.iter() {
            if admin_families.contains(&claim.family_id) 
                && matches!(claim.status, ClaimStatus::Pending) {
                admin_claims.push(claim);
            }
        }
    });

    // Sort by creation time (newest first)
    admin_claims.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(admin_claims)
}

// Process a claim request (approve/reject)
#[update]
pub fn process_ghost_profile_claim(request: ProcessClaimRequest) -> Result<String, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    // Get and verify the claim request
    let claim = CLAIM_REQUESTS.with(|claims| {
        let claims = claims.borrow();
        claims.get(&request.claim_id)
    });

    let mut claim = match claim {
        Some(c) => c,
        None => return Err("Claim request not found".to_string()),
    };

    // Verify caller is the admin of the family
    let is_admin = FAMILIES.with(|families| {
        let families = families.borrow();
        match families.get(&claim.family_id) {
            Some(family) => family.admin == caller,
            None => false,
        }
    });

    if !is_admin {
        return Err("Only family admin can process claim requests".to_string());
    }

    // Check if claim is still pending
    if !matches!(claim.status, ClaimStatus::Pending) {
        return Err("This claim request has already been processed".to_string());
    }

    // Update claim status
    claim.status = if request.approve { ClaimStatus::Approved } else { ClaimStatus::Rejected };

    // If approved, link the ghost profile to the user
    if request.approve {
        FAMILIES.with(|families| {
            let mut families = families.borrow_mut();
            if let Some(mut family) = families.get(&claim.family_id) {
                // Find and update the ghost member
                if let Some(member) = family.members.iter_mut().find(|m| m.id == claim.member_id) {
                    member.profile_principal = Some(claim.requester);
                    family.updated_at = api::time();
                }
                
                families.insert(claim.family_id.clone(), family);
            }
        });

        // Add the family to user's family list
        USER_FAMILIES.with(|user_families| {
            let mut user_families = user_families.borrow_mut();
            let mut user_family_list = user_families.get(&claim.requester).unwrap_or_default();
            if !user_family_list.0.contains(&claim.family_id) {
                user_family_list.0.push(claim.family_id.clone());
                user_families.insert(claim.requester, user_family_list);
            }
        });
    }

    // Update the claim request
    CLAIM_REQUESTS.with(|claims| {
        let mut claims = claims.borrow_mut();
        claims.insert(request.claim_id.clone(), claim);
    });

    let result_msg = if request.approve {
        format!("Ghost profile claim approved. User has been linked to the family member.")
    } else {
        format!("Ghost profile claim rejected.")
    };

    Ok(result_msg)
}

// Get claim requests for a specific user
#[query]
pub fn get_my_claim_requests() -> Result<Vec<ClaimRequest>, String> {
    let caller = api::caller();
    
    if !DEV_MODE && caller == Principal::anonymous() {
        return Err("Authentication required".to_string());
    }

    let mut user_claims = Vec::new();

    CLAIM_REQUESTS.with(|claims| {
        let claims = claims.borrow();
        
        for (_, claim) in claims.iter() {
            if claim.requester == caller {
                user_claims.push(claim);
            }
        }
    });

    // Sort by creation time (newest first)
    user_claims.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(user_claims)
}