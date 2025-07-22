use candid::Principal;
use ic_cdk::api;
use ic_cdk_macros::*;

// Module declarations
mod types;
mod storage;
mod profile;
mod family;

// Re-export types for Candid interface
pub use types::*;

// Re-export functions for Candid interface
pub use profile::{create_profile, update_profile, get_profile};
pub use family::{
    create_family, get_user_families, get_family, add_family_member, 
    remove_family_member, add_member_event, get_member_events_chronological
};

#[init]
fn init() {
    ic_cdk::println!("Family tree backend initialized");
}

#[query]
fn whoami() -> Principal {
    api::caller()
}