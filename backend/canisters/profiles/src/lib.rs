use candid::{CandidType, Deserialize};
use ic_cdk::{init, query, update};
use rand::{distributions::Alphanumeric, Rng, thread_rng};
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone)]
struct Profile {
    user_id: String,
    name: String,
    surname: String,
    family_id: Option<String>,
    email: String,
}

thread_local! {
    static PROFILES: RefCell<HashMap<String, Profile>> = RefCell::new(HashMap::new());
}

#[init]
fn init() {}

// Note: This function generates a unique ID by checking against the PROFILES map.
// Using it for both user_id and family_id might not be the intended logic,
// as family_id uniqueness should likely be checked against a separate families map.
fn generate_unique_id(length: usize) -> String {
    let mut rng = thread_rng();
    PROFILES.with(|profiles_ref| {
        let profiles = profiles_ref.borrow();
        loop {
            let id: String = (&mut rng)
                .sample_iter(&Alphanumeric)
                .take(length)
                .map(char::from)
                .collect();

            if !profiles.contains_key(&id) {
                return id;
            }
        }
    })
}

#[update]
fn create_profile(name: String, surname: String, email: String, is_family_creator: bool) -> Profile {
    let user_id = generate_unique_id(10);
    
    let family_id = if is_family_creator {
        Some(generate_unique_id(7))
    } else {
        None
    };

    let profile = Profile {
        user_id: user_id.clone(),
        name,
        surname,
        email,
        family_id,
    };

    PROFILES.with(|profiles_ref| {
        profiles_ref.borrow_mut().insert(user_id, profile.clone());
    });

    profile
}

#[query]
fn get_profile(user_id: String) -> Option<Profile> {
    PROFILES.with(|profiles_ref| {
        profiles_ref.borrow().get(&user_id).cloned()
    })
}