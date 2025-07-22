use candid::Principal;
use ic_cdk::api;
use ic_cdk_macros::*;
use ic_stable_structures::memory_manager::MemoryId;

// Memory IDs for stable storage
pub const INVITATIONS_MEMORY_ID: MemoryId = MemoryId::new(4);
pub const NOTIFICATIONS_MEMORY_ID: MemoryId = MemoryId::new(5);
pub const USER_SEARCH_MEMORY_ID: MemoryId = MemoryId::new(6);

// Re-export memory manager
pub use storage::MEMORY_MANAGER;

// Module declarations
mod types;
mod storage;
mod profile;
mod family;
mod ghost;
mod invitations;

// Re-export types for Candid interface
pub use types::*;

// Re-export functions for Candid interface
pub use profile::{create_profile, update_profile, get_profile, create_profile_with_ghost_check, update_profile_with_ghost_check};
pub use family::{
    create_family, get_user_families, get_family, add_family_member, 
    remove_family_member, add_member_event, get_member_events_chronological,
    toggle_family_visibility
};
pub use ghost::{
    find_matching_ghost_profiles, submit_ghost_profile_claim, get_pending_claims_for_admin,
    process_ghost_profile_claim, get_my_claim_requests
};
pub use invitations::{
    search_users, send_family_invitation, process_family_invitation, 
    get_my_invitations, get_sent_invitations, get_my_notifications,
    get_unread_notification_count, mark_notification_read, mark_all_notifications_read
};

#[init]
fn init() {
    ic_cdk::println!("Family tree backend initialized");
}

#[query]
fn whoami() -> Principal {
    api::caller()
}