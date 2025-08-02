use candid::Principal;
use ic_cdk::api;
use ic_cdk_macros::*;
use ic_stable_structures::memory_manager::MemoryId;

// Memory IDs for stable storage
pub const INVITATIONS_MEMORY_ID: MemoryId = MemoryId::new(4);
pub const NOTIFICATIONS_MEMORY_ID: MemoryId = MemoryId::new(5);
pub const USER_SEARCH_MEMORY_ID: MemoryId = MemoryId::new(6);

// Module declarations
mod core;
mod user;
mod family;
mod social;

// Re-export memory manager
pub use core::storage::MEMORY_MANAGER;

// Re-export types for Candid interface
pub use core::types::*;

// Re-export functions for Candid interface
pub use user::profile::{create_profile, update_profile, get_profile, create_profile_with_ghost_check, update_profile_with_ghost_check};
pub use family::{
    create_family, get_user_families, get_family, add_family_member, 
    remove_family_member, add_member_event, get_member_events_chronological,
    toggle_family_visibility
};
pub use social::ghost::{
    find_matching_ghost_profiles, submit_ghost_profile_claim, get_pending_claims_for_admin,
    process_ghost_profile_claim, get_my_claim_requests
};
// Import invitation functions for internal use
use social::invitations::{
    search_users as search_users_impl, send_family_invitation as send_family_invitation_impl, 
    process_family_invitation as process_family_invitation_impl,
    get_my_invitations as get_my_invitations_impl, get_sent_invitations as get_sent_invitations_impl, 
    get_my_notifications as get_my_notifications_impl,
    get_unread_notification_count as get_unread_notification_count_impl, 
    mark_notification_read as mark_notification_read_impl, 
    mark_all_notifications_read as mark_all_notifications_read_impl
};

// Export candid interface manually
ic_cdk::export_candid!();

#[init]
fn init() {
    ic_cdk::println!("Family tree backend initialized");
}

#[query]
fn whoami() -> Principal {
    api::caller()
}

#[query]
fn test_simple() -> String {
    "Hello from test function".to_string()
}

#[query]
fn search_users(query: String) -> Result<Vec<UserSearchResult>, String> {
    search_users_impl(query)
}

#[update]
fn send_family_invitation(request: SendInvitationRequest) -> Result<String, String> {
    send_family_invitation_impl(request)
}

#[update]
fn process_family_invitation(request: ProcessInvitationRequest) -> Result<String, String> {
    process_family_invitation_impl(request)
}

#[query]
fn get_my_invitations() -> Result<Vec<FamilyInvitation>, String> {
    get_my_invitations_impl()
}

#[query]
fn get_sent_invitations() -> Result<Vec<FamilyInvitation>, String> {
    get_sent_invitations_impl()
}

#[query]
fn get_my_notifications() -> Result<Vec<Notification>, String> {
    get_my_notifications_impl()
}

#[query]
fn get_unread_notification_count() -> Result<u64, String> {
    get_unread_notification_count_impl()
}

#[update]
fn mark_notification_read(notification_id: String) -> Result<String, String> {
    mark_notification_read_impl(notification_id)
}

#[update]
fn mark_all_notifications_read() -> Result<String, String> {
    mark_all_notifications_read_impl()
}

// Family member update functions
#[update]
fn update_family_member(request: UpdateFamilyMemberRequest) -> Result<FamilyMember, String> {
    family::update_family_member(request)
}

#[update] 
fn update_member_event(request: UpdateEventRequest) -> Result<FamilyEvent, String> {
    family::update_member_event(request)
}

// Test function to check if basic invitation functions work
#[query]
fn test_search_users(query: String) -> Result<Vec<String>, String> {
    // Simple test version
    if query.len() < 2 {
        return Err("Query too short".to_string());
    }
    Ok(vec![format!("Test user for query: {}", query)])
}

