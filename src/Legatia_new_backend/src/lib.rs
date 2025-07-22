use candid::Principal;
use ic_cdk::api;
use ic_cdk_macros::*;

// Module declarations
mod types;
mod storage;
mod profile;
mod family;
mod ghost;

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

#[init]
fn init() {
    ic_cdk::println!("Family tree backend initialized");
}

#[query]
fn whoami() -> Principal {
    api::caller()
}