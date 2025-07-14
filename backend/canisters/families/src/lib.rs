use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{update, query, init};
use ic_cdk::api::management_canister::main::raw_rand;
use ic_cdk::call::Call;
use std::collections::HashMap;
use std::cell::RefCell;

#[derive(CandidType, Deserialize, Clone)]
pub struct Family {
    pub family_id: String,
    pub creator_id: String,
    pub name: String,
    pub members: Vec<String>,
}

// In-memory storage for families
thread_local! {
    static FAMILIES: RefCell<HashMap<String, Family>> = RefCell::new(HashMap::new());
}

#[init]
fn init() {}

// Generates a random alphanumeric string of a given length.
pub async fn generate_id(length: usize) -> String {
    let id_bytes = raw_rand().await.expect("Failed to get random bytes").0;
    let hex_string: String = id_bytes.iter()
        .map(|b| format!("{:02x}", b))
        .collect();
    hex_string.chars().take(length).collect()
}

#[update]
pub async fn create_family(user_id: String, family_name: String) -> Result<String, String> {
    let family_id = generate_id(7).await;

    let new_family = Family {
        family_id: family_id.clone(),
        creator_id: user_id.clone(),
        name: family_name,
        members: vec![user_id.clone()],
    };

    FAMILIES.with(|families_ref| {
        families_ref.borrow_mut().insert(family_id.clone(), new_family);
    });

    Ok(family_id)
}

#[update]
pub async fn add_member_to_family(user_id: String, family_id: String, invite_code: String) -> Result<(), String> {
    // Verify the invite code by calling the invites canister
    let invites_canister_id = Principal::from_text("YOUR_INVITES_CANISTER_ID").expect("Invalid principal");
    let response = Call::unbounded_wait(invites_canister_id, "use_invite").with_arg((invite_code,)).await.map_err(|e| format!("Failed to call invites canister: {:?}", e))?;
    let (result,): (Result<String, String>,) = response.reply().await.map_err(|e| format!("Failed to get reply from invites canister: {:?}", e))?;

    match result {
        Ok(used_family_id) => {
            if used_family_id != family_id {
                return Err("Invite code is for a different family.".to_string());
            }
        },
        Err(e) => return Err(e),
    }

    // Add the user to the family
    FAMILIES.with(|families_ref| {
        let mut families = families_ref.borrow_mut();
        if let Some(family) = families.get_mut(&family_id) {
            if !family.members.contains(&user_id) {
                family.members.push(user_id.clone());
            }
        } else {
            return Err("Family not found.".to_string());
        }
        Ok(())
    })
}

#[query]
pub fn get_family(family_id: String) -> Option<Family> {
    FAMILIES.with(|families_ref| {
        families_ref.borrow().get(&family_id).cloned()
    })
}