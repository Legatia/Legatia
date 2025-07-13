use candid::{CandidType, Deserialize};
use ic_cdk::{update, init};
use rand::{distributions::Alphanumeric, Rng};
use std::collections::HashMap;
use std::cell::RefCell;

#[derive(CandidType, Deserialize, Clone)]
struct Family {
    family_id: String,
    creator_id: String,
    name: String,
    members: Vec<String>,
}

#[derive(CandidType, Deserialize, Clone)]
struct Profile {
    user_id: String,
    family_id: Option<String>,
}

thread_local! {
    static PROFILES: RefCell<HashMap<String, Profile>> = RefCell::new(HashMap::new());
    static FAMILIES: RefCell<HashMap<String, Family>> = RefCell::new(HashMap::new());
}

#[init]
fn init() {}

fn generate_id(length: usize) -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(length)
        .map(char::from)
        .collect()
}

#[update]
fn create_family(user_id: String, family_name: String) -> Result<String, String> {
    PROFILES.with(|profiles_ref| {
        let mut profiles = profiles_ref.borrow_mut();
        let profile = profiles.get_mut(&user_id).ok_or("User not found")?;

        if profile.family_id.is_some() {
            return Err("User already belongs to a family".to_string());
        }

        let family_id = generate_id(7);

        let new_family = Family {
            family_id: family_id.clone(),
            creator_id: user_id.clone(),
            name: family_name,
            members: vec![user_id.clone()],
        };

        FAMILIES.with(|families_ref| {
            families_ref.borrow_mut().insert(family_id.clone(), new_family);
        });

        profile.family_id = Some(family_id.clone());

        Ok(family_id)
    })
}