use ic_cdk::{api, query, update};
use candid::{Principal};
use ic_stable_structures::StableBTreeMap;
use std::cell::RefCell;
use crate::types::*;
use crate::MEMORY_MANAGER;

use crate::storage::Memory;

// Thread-local storage for invitations and notifications
thread_local! {
    static INVITATIONS: RefCell<StableBTreeMap<String, FamilyInvitation, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(crate::INVITATIONS_MEMORY_ID)))
    );
    
    static NOTIFICATIONS: RefCell<StableBTreeMap<String, Notification, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(crate::NOTIFICATIONS_MEMORY_ID)))
    );
    
    static USER_SEARCH_INDEX: RefCell<StableBTreeMap<String, UserSearchResult, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(crate::USER_SEARCH_MEMORY_ID)))
    );
}

// Helper function to generate unique ID
fn generate_id(prefix: &str) -> String {
    format!("{}_{}", prefix, api::time())
}

// Helper function to create notification
fn create_notification(
    recipient: Principal,
    title: String,
    message: String,
    notification_type: NotificationType,
    action_url: Option<String>,
    metadata: Option<String>,
) -> String {
    let notification_id = generate_id("notification");
    let notification = Notification {
        id: notification_id.clone(),
        recipient,
        title,
        message,
        notification_type,
        created_at: api::time(),
        read: false,
        action_url,
        metadata,
    };
    
    NOTIFICATIONS.with(|n| {
        n.borrow_mut().insert(notification_id.clone(), notification);
    });
    
    notification_id
}

// User Search Functions
pub fn update_user_search_index(profile: &UserProfile, principal: Principal) {
    let search_result = UserSearchResult {
        id: profile.id.clone(),
        full_name: profile.full_name.clone(),
        surname_at_birth: profile.surname_at_birth.clone(),
        user_principal: principal,
    };
    
    USER_SEARCH_INDEX.with(|index| {
        // Index by user ID
        index.borrow_mut().insert(profile.id.clone(), search_result.clone());
        
        // Index by full name (normalized)
        let name_key = format!("name_{}", profile.full_name.to_lowercase());
        index.borrow_mut().insert(name_key, search_result.clone());
        
        // Index by surname
        let surname_key = format!("surname_{}", profile.surname_at_birth.to_lowercase());
        index.borrow_mut().insert(surname_key, search_result);
    });
}

pub fn search_users(query: String) -> Result<Vec<UserSearchResult>, String> {
    // Validate search query
    if let Err(_validation_error) = crate::validation::validate_search_query(&query) {
        return Err("Invalid search query format".to_string());
    }
    
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();
    let mut seen_principals = std::collections::HashSet::new();
    
    USER_SEARCH_INDEX.with(|index| {
        for (_key, user) in index.borrow().iter() {
            // Avoid duplicates
            if seen_principals.contains(&user.user_principal) {
                continue;
            }
            
            // Search by ID exact match
            if user.id.to_lowercase().contains(&query_lower) {
                results.push(user.clone());
                seen_principals.insert(user.user_principal);
                continue;
            }
            
            // Search by name
            if user.full_name.to_lowercase().contains(&query_lower) {
                results.push(user.clone());
                seen_principals.insert(user.user_principal);
                continue;
            }
            
            // Search by surname
            if user.surname_at_birth.to_lowercase().contains(&query_lower) {
                results.push(user.clone());
                seen_principals.insert(user.user_principal);
            }
        }
    });
    
    // Limit results to 20 for performance
    results.truncate(20);
    Ok(results)
}

// Family Invitation Functions
pub fn send_family_invitation(request: SendInvitationRequest) -> Result<String, String> {
    let caller = api::caller();
    
    // Verify the caller is admin of the family
    let family = crate::family::get_family_internal(&request.family_id)?;
    if family.admin != caller {
        return Err("Only family admin can send invitations".to_string());
    }
    
    // Find the target user
    let target_user = USER_SEARCH_INDEX.with(|index| {
        index.borrow().get(&request.user_id)
    });
    
    let target_user = match target_user {
        Some(user) => user,
        None => return Err("User not found".to_string()),
    };
    
    // Check if user is already a family member
    if family.members.iter().any(|member| {
        member.profile_principal == Some(target_user.user_principal)
    }) {
        return Err("User is already a member of this family".to_string());
    }
    
    // Check for existing pending invitation
    let existing_invitation = INVITATIONS.with(|invitations| {
        invitations.borrow().iter().find(|(_, inv)| {
            inv.family_id == request.family_id && 
            inv.invitee == target_user.user_principal && 
            matches!(inv.status, InvitationStatus::Pending)
        }).map(|(_, inv)| inv)
    });
    
    if existing_invitation.is_some() {
        return Err("Pending invitation already exists for this user".to_string());
    }
    
    // Get inviter profile for name
    let inviter_profile = crate::profile::get_profile_internal(caller)?;
    
    // Create invitation
    let invitation_id = generate_id("invitation");
    let invitation = FamilyInvitation {
        id: invitation_id.clone(),
        family_id: request.family_id.clone(),
        family_name: family.name.clone(),
        inviter: caller,
        inviter_name: inviter_profile.full_name.clone(),
        invitee: target_user.user_principal,
        invitee_id: target_user.id.clone(),
        message: request.message.clone(),
        created_at: api::time(),
        status: InvitationStatus::Pending,
        relationship_to_admin: request.relationship_to_admin.clone(),
    };
    
    // Store invitation
    INVITATIONS.with(|invitations| {
        invitations.borrow_mut().insert(invitation_id.clone(), invitation);
    });
    
    // Create notification for invitee
    let notification_title = format!("Family Invitation from {}", family.name);
    let notification_message = format!(
        "{} has invited you to join the {} family as their {}. {}",
        inviter_profile.full_name,
        family.name,
        request.relationship_to_admin,
        request.message.unwrap_or_default()
    );
    
    create_notification(
        target_user.user_principal,
        notification_title,
        notification_message,
        NotificationType::FamilyInvitation,
        Some(format!("/invitations/{}", invitation_id)),
        Some(invitation_id.clone()),
    );
    
    Ok(invitation_id)
}

pub fn process_family_invitation(request: ProcessInvitationRequest) -> Result<String, String> {
    let caller = api::caller();
    
    // Get the invitation
    let mut invitation = INVITATIONS.with(|invitations| {
        invitations.borrow().get(&request.invitation_id)
    }).ok_or("Invitation not found".to_string())?;
    
    // Verify caller is the invitee
    if invitation.invitee != caller {
        return Err("You can only respond to your own invitations".to_string());
    }
    
    // Check if invitation is still pending
    if !matches!(invitation.status, InvitationStatus::Pending) {
        return Err("Invitation has already been processed".to_string());
    }
    
    // Process the response
    if request.accept {
        // Accept invitation - add user to family
        invitation.status = InvitationStatus::Accepted;
        
        // Get user profile
        let user_profile = crate::profile::get_profile_internal(caller)?;
        
        // Add user to family as a linked member
        let add_request = crate::types::AddFamilyMemberRequest {
            family_id: invitation.family_id.clone(),
            full_name: user_profile.full_name.clone(),
            surname_at_birth: user_profile.surname_at_birth.clone(),
            sex: user_profile.sex.clone(),
            birthday: Some(user_profile.birthday.clone()),
            birth_city: Some(user_profile.birth_city.clone()),
            birth_country: Some(user_profile.birth_country.clone()),
            death_date: None,
            relationship_to_admin: invitation.relationship_to_admin.clone(),
        };
        
        // Add member with linked profile
        let mut family = crate::family::get_family_internal(&invitation.family_id)?;
        let member_id = crate::family::generate_member_id();
        
        let family_member = FamilyMember {
            id: member_id,
            profile_principal: Some(caller), // Link to user's profile
            full_name: add_request.full_name,
            surname_at_birth: add_request.surname_at_birth,
            sex: add_request.sex,
            birthday: add_request.birthday,
            birth_city: add_request.birth_city,
            birth_country: add_request.birth_country,
            death_date: add_request.death_date,
            relationship_to_admin: add_request.relationship_to_admin,
            events: Vec::new(),
            created_at: api::time(),
            created_by: invitation.inviter, // Credit the inviter
        };
        
        family.members.push(family_member);
        family.updated_at = api::time();
        
        // Update family
        crate::family::update_family_internal(family)?;
        
        // Update user's family list
        crate::profile::add_user_to_family(caller, invitation.family_id.clone())?;
        
        // Notify family admin of acceptance
        create_notification(
            invitation.inviter,
            format!("{} joined your family!", user_profile.full_name),
            format!("{} has accepted your invitation to join the {} family.", 
                user_profile.full_name, invitation.family_name),
            NotificationType::FamilyUpdate,
            Some(format!("/family/{}", invitation.family_id)),
            None,
        );
        
    } else {
        // Decline invitation
        invitation.status = InvitationStatus::Declined;
        
        // Notify family admin of decline
        let user_profile = crate::profile::get_profile_internal(caller)?;
        create_notification(
            invitation.inviter,
            "Family invitation declined".to_string(),
            format!("{} has declined your invitation to join the {} family.", 
                user_profile.full_name, invitation.family_name),
            NotificationType::FamilyUpdate,
            None,
            None,
        );
    }
    
    // Update invitation status
    INVITATIONS.with(|invitations| {
        invitations.borrow_mut().insert(request.invitation_id.clone(), invitation);
    });
    
    let status = if request.accept { "accepted" } else { "declined" };
    Ok(format!("Invitation {}", status))
}

pub fn get_my_invitations() -> Result<Vec<FamilyInvitation>, String> {
    let caller = api::caller();
    
    let invitations = INVITATIONS.with(|invitations| {
        invitations.borrow()
            .iter()
            .filter(|(_, inv)| inv.invitee == caller)
            .map(|(_, inv)| inv)
            .collect::<Vec<_>>()
    });
    
    Ok(invitations)
}

pub fn get_sent_invitations() -> Result<Vec<FamilyInvitation>, String> {
    let caller = api::caller();
    
    let invitations = INVITATIONS.with(|invitations| {
        invitations.borrow()
            .iter()
            .filter(|(_, inv)| inv.inviter == caller)
            .map(|(_, inv)| inv)
            .collect::<Vec<_>>()
    });
    
    Ok(invitations)
}

// Notification Functions
pub fn get_my_notifications() -> Result<Vec<Notification>, String> {
    let caller = api::caller();
    
    let notifications = NOTIFICATIONS.with(|notifications| {
        notifications.borrow()
            .iter()
            .filter(|(_, notif)| notif.recipient == caller)
            .map(|(_, notif)| notif)
            .collect::<Vec<_>>()
    });
    
    Ok(notifications)
}

pub fn get_unread_notification_count() -> Result<u64, String> {
    let caller = api::caller();
    
    let count = NOTIFICATIONS.with(|notifications| {
        notifications.borrow()
            .iter()
            .filter(|(_, notif)| notif.recipient == caller && !notif.read)
            .count() as u64
    });
    
    Ok(count)
}

pub fn mark_notification_read(notification_id: String) -> Result<String, String> {
    let caller = api::caller();
    
    let mut notification = NOTIFICATIONS.with(|notifications| {
        notifications.borrow().get(&notification_id)
    }).ok_or("Notification not found".to_string())?;
    
    if notification.recipient != caller {
        return Err("You can only mark your own notifications as read".to_string());
    }
    
    notification.read = true;
    
    NOTIFICATIONS.with(|notifications| {
        notifications.borrow_mut().insert(notification_id, notification);
    });
    
    Ok("Notification marked as read".to_string())
}

pub fn mark_all_notifications_read() -> Result<String, String> {
    let caller = api::caller();
    let mut count = 0;
    
    NOTIFICATIONS.with(|notifications| {
        let mut borrowed = notifications.borrow_mut();
        let mut updates = Vec::new();
        
        for (id, mut notif) in borrowed.iter() {
            if notif.recipient == caller && !notif.read {
                notif.read = true;
                updates.push((id, notif));
                count += 1;
            }
        }
        
        for (id, notif) in updates {
            borrowed.insert(id, notif);
        }
    });
    
    Ok(format!("Marked {} notifications as read", count))
}