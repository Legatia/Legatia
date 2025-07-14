use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{init, query, update};
use ic_cdk::api::management_canister::raw_rand;
use ic_cdk::call::Call;
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Profile {
    pub user_id: String,
    pub name: String,
    pub surname: String,
    pub family_id: Option<String>,
    pub email: String,
}

thread_local! {
    static PROFILES: RefCell<HashMap<String, Profile>> = RefCell::new(HashMap::new());
}

#[init]
fn init() {}

async fn generate_unique_id(length: usize) -> String {
    loop {
        let id_bytes = raw_rand().await.expect("Failed to get random bytes").0;
        let hex_string: String = id_bytes.iter()
            .map(|b| format!("{:02x}", b))
            .collect();
        let id: String = hex_string.chars().take(length).collect();

        let is_unique = PROFILES.with(|profiles_ref| {
            let profiles = profiles_ref.borrow();
            !profiles.contains_key(&id)
        });

        if is_unique {
            return id;
        }
    }
}

#[update]
pub async fn create_profile(name: String, surname: String, email: String, family_id: Option<String>, invite_code: Option<String>) -> Result<Profile, String> {
    let user_id = generate_unique_id(10).await;

    if let (Some(fam_id), Some(code)) = (family_id.clone(), invite_code) {
        // Joining an existing family
        let families_canister_id = Principal::from_text("YOUR_FAMILIES_CANISTER_ID").expect("Invalid principal");
        let response = Call::unbounded_wait(families_canister_id, "add_member_to_family").with_arg((user_id.clone(), fam_id.clone(), code)).await.map_err(|e| format!("Failed to call families canister: {:?}", e))?;
        let (result,): (Result<(), String>,) = response.reply().await.map_err(|e| format!("Failed to get reply from families canister: {:?}", e))?;

        if let Err(e) = result {
            return Err(e);
        }
        let profile = Profile {
            user_id: user_id.clone(),
            name,
            surname,
            email,
            family_id: Some(fam_id),
        };
        PROFILES.with(|profiles_ref| {
            profiles_ref.borrow_mut().insert(user_id, profile.clone());
        });
        Ok(profile)
    } else {
        // Creating a new family
        let new_family_id = generate_unique_id(7).await;

        let families_canister_id = Principal::from_text("YOUR_FAMILIES_CANISTER_ID").expect("Invalid principal");
        let response = Call::unbounded_wait(families_canister_id, "create_family").with_arg((user_id.clone(), format!("{} Family", surname))).await.map_err(|e| format!("Failed to call families canister: {:?}", e))?;
        let (result,): (Result<String, String>,) = response.reply().await.map_err(|e| format!("Failed to get reply from families canister: {:?}", e))?;

        if let Err(e) = result {
            return Err(e);
        }
        let profile = Profile {
            user_id: user_id.clone(),
            name,
            surname,
            email,
            family_id: Some(new_family_id.clone()),
        };
        PROFILES.with(|profiles_ref| {
            profiles_ref.borrow_mut().insert(user_id, profile.clone());
        });
        Ok(profile)
    }
}

#[query]
pub fn get_profile(user_id: String) -> Option<Profile> {
    PROFILES.with(|profiles_ref| {
        profiles_ref.borrow().get(&user_id).cloned()
    })
}