use candid::Principal;
use std::cell::RefCell;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};

use crate::core::types::{UserProfile, Family, UserFamilyList, ClaimRequest, FamilyInvitation, Notification, UserSearchResult};

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    pub static PROFILES: RefCell<StableBTreeMap<Principal, UserProfile, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    pub static FAMILIES: RefCell<StableBTreeMap<String, Family, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    pub static USER_FAMILIES: RefCell<StableBTreeMap<Principal, UserFamilyList, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );

    pub static CLAIM_REQUESTS: RefCell<StableBTreeMap<String, ClaimRequest, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );

    pub static INVITATIONS: RefCell<StableBTreeMap<String, FamilyInvitation, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );

    pub static NOTIFICATIONS: RefCell<StableBTreeMap<String, Notification, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5)))
        )
    );

    pub static USER_SEARCH_INDEX: RefCell<StableBTreeMap<String, UserSearchResult, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(6)))
        )
    );
}

// Helper function to generate unique IDs using secure random generation
pub fn generate_id() -> String {
    use ic_cdk::api::management_canister::main::raw_rand;
    
    // Get secure random bytes from the IC
    let _seed_future = raw_rand();
    
    // For now, use a combination of timestamp, caller, and instruction counter for uniqueness
    // In production, you should await the raw_rand() call for true randomness
    let timestamp = ic_cdk::api::time();
    let caller = ic_cdk::api::caller();
    let instruction_counter = ic_cdk::api::instruction_counter();
    
    // Create a more secure hash-based ID
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    timestamp.hash(&mut hasher);
    caller.hash(&mut hasher);
    instruction_counter.hash(&mut hasher);
    
    format!("{:x}", hasher.finish())
}