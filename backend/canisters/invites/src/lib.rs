use candid::{CandidType, Deserialize};
use ic_cdk::{update, query, init};
use ic_cdk::api::management_canister::main::raw_rand;
use std::collections::HashMap;
use std::cell::RefCell;

#[derive(CandidType, Deserialize, Clone)]
pub struct Invite {
    code: String,
    family_id: String,
    // The user who created the invite
    creator_id: String, 
    is_used: bool,
}

thread_local! {
    static INVITES: RefCell<HashMap<String, Invite>> = RefCell::new(HashMap::new());
}

#[init]
fn init() {}

// Generates a random alphanumeric string of a given length.
pub async fn generate_random_code(length: usize) -> String {
    let id_bytes = raw_rand().await.expect("Failed to get random bytes").0;
    let hex_string: String = id_bytes.iter()
        .map(|b| format!("{:02x}", b))
        .collect();
    hex_string.chars().take(length).collect()
}

#[update]
pub async fn create_invite(family_id: String, creator_id: String) -> Result<String, String> {
    let code = generate_random_code(8).await;
    let new_invite = Invite {
        code: code.clone(),
        family_id,
        creator_id,
        is_used: false,
    };

    INVITES.with(|invites_ref| {
        invites_ref.borrow_mut().insert(code.clone(), new_invite);
    });

    Ok(code)
}

#[query]
pub fn get_invite(code: String) -> Option<Invite> {
    INVITES.with(|invites_ref| {
        invites_ref.borrow().get(&code).cloned()
    })
}

#[update]
pub fn use_invite(code: String) -> Result<String, String> {
    INVITES.with(|invites_ref| {
        let mut invites = invites_ref.borrow_mut();
        if let Some(invite) = invites.get_mut(&code) {
            if invite.is_used {
                return Err("Invite code has already been used.".to_string());
            }
            invite.is_used = true;
            Ok(invite.family_id.clone())
        } else {
            Err("Invalid invite code.".to_string())
        }
    })
}