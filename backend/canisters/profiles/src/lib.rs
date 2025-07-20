
use candid::{CandidType, Principal};
use ic_cdk::{
    query,
    update,
    api::caller,
};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Clone, Debug, Default, CandidType, Serialize, Deserialize)]
struct Profile {
    name: String,
    sex: String,
    birthday: String,
    birthplace: String,
    photo: Vec<u8>,
}

type ProfileStore = BTreeMap<Principal, Profile>;

#[update]
fn create_profile(profile: Profile) -> Result<(), String> {
    let caller = caller();
    let profile_store = ic_cdk::storage::get_mut::<ProfileStore>();

    if profile_store.contains_key(&caller) {
        return Err("Profile already exists".to_string());
    }

    profile_store.insert(caller, profile);
    Ok(())
}

#[query]
fn read_profile(principal: Principal) -> Result<Profile, String> {
    let profile_store = ic_cdk::storage::get::<ProfileStore>();
    profile_store
        .get(&principal)
        .cloned()
        .ok_or_else(|| "Profile not found".to_string())
}

#[query]
fn get_own_profile() -> Result<Profile, String> {
    let caller = caller();
    read_profile(caller)
}

#[update]
fn update_profile(profile: Profile) -> Result<(), String> {
    let caller = caller();
    let profile_store = ic_cdk::storage::get_mut::<ProfileStore>();

    if !profile_store.contains_key(&caller) {
        return Err("Profile not found".to_string());
    }

    profile_store.insert(caller, profile);
    Ok(())
}
