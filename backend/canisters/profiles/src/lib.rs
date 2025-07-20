
use candid::{CandidType, Principal};
use ic_cdk::{
    query,
    update,
    api::{caller, time},
};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use rand::Rng;
use rand::distributions::Alphanumeric;

const LINKING_CODE_EXPIRY_SECONDS: u64 = 300; // 5 minutes

#[derive(Clone, Debug, Default, CandidType, Serialize, Deserialize)]
struct Profile {
    name: String,
    sex: String,
    birthday: String,
    birthplace: String,
    photo: Vec<u8>,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct UserAccount {
    profile: Profile,
    linked_principals: Vec<Principal>,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct LinkingCode {
    primary_principal: Principal,
    expiry_time: u64,
}

// Stores the primary principal for each linked principal
type PrincipalToPrimaryMap = BTreeMap<Principal, Principal>;
// Stores the UserAccount for each primary principal
type UserAccounts = BTreeMap<Principal, UserAccount>;
// Stores active linking codes
type LinkingCodes = BTreeMap<String, LinkingCode>;

// Helper to get the UserAccount for the current caller
fn get_user_account_for_caller() -> Result<UserAccount, String> {
    let caller = caller();
    let principal_to_primary_map = ic_cdk::storage::get::<PrincipalToPrimaryMap>();
    let user_accounts = ic_cdk::storage::get::<UserAccounts>();

    let primary_principal = principal_to_primary_map
        .get(&caller)
        .ok_or_else(|| "Caller not associated with any account".to_string())?;

    user_accounts
        .get(primary_principal)
        .cloned()
        .ok_or_else(|| "User account not found".to_string())
}

// Helper to get the mutable UserAccount for the current caller
fn get_user_account_for_caller_mut() -> Result<&'static mut UserAccount, String> {
    let caller = caller();
    let principal_to_primary_map = ic_cdk::storage::get::<PrincipalToPrimaryMap>();
    let user_accounts = ic_cdk::storage::get_mut::<UserAccounts>();

    let primary_principal = principal_to_primary_map
        .get(&caller)
        .ok_or_else(|| "Caller not associated with any account".to_string())?;

    user_accounts
        .get_mut(primary_principal)
        .ok_or_else(|| "User account not found".to_string())
}

#[update]
fn create_profile(profile: Profile) -> Result<(), String> {
    let caller = caller();
    let principal_to_primary_map = ic_cdk::storage::get_mut::<PrincipalToPrimaryMap>();
    let user_accounts = ic_cdk::storage::get_mut::<UserAccounts>();

    if principal_to_primary_map.contains_key(&caller) {
        return Err("Profile already exists for this principal".to_string());
    }

    let user_account = UserAccount {
        profile,
        linked_principals: vec![caller],
    };

    user_accounts.insert(caller, user_account);
    principal_to_primary_map.insert(caller, caller);

    Ok(())
}

#[query]
fn read_profile(principal: Principal) -> Result<Profile, String> {
    let principal_to_primary_map = ic_cdk::storage::get::<PrincipalToPrimaryMap>();
    let user_accounts = ic_cdk::storage::get::<UserAccounts>();

    let primary_principal = principal_to_primary_map
        .get(&principal)
        .ok_or_else(|| "Principal not associated with any account".to_string())?;

    user_accounts
        .get(primary_principal)
        .map(|ua| ua.profile.clone())
        .ok_or_else(|| "User account not found".to_string())
}

#[query]
fn get_own_profile() -> Result<Profile, String> {
    get_user_account_for_caller().map(|ua| ua.profile)
}

#[update]
fn update_profile(profile: Profile) -> Result<(), String> {
    let user_account = get_user_account_for_caller_mut()?;
    user_account.profile = profile;
    Ok(())
}

#[update]
fn generate_linking_code() -> Result<String, String> {
    let caller = caller();
    let principal_to_primary_map = ic_cdk::storage::get::<PrincipalToPrimaryMap>();
    let linking_codes = ic_cdk::storage::get_mut::<LinkingCodes>();

    let primary_principal = principal_to_primary_map
        .get(&caller)
        .ok_or_else(|| "Caller not associated with any account".to_string())?;

    let mut rng = rand::thread_rng();
    let code: String = std::iter::repeat(())
        .map(|()| rng.sample(Alphanumeric))
        .map(char::from)
        .take(10) // Generate a 10-character alphanumeric code
        .collect();

    let expiry_time = time() + LINKING_CODE_EXPIRY_SECONDS;

    linking_codes.insert(
        code.clone(),
        LinkingCode {
            primary_principal: *primary_principal,
            expiry_time,
        },
    );

    Ok(code)
}

#[update]
fn link_device(code: String) -> Result<(), String> {
    let caller = caller();
    let principal_to_primary_map = ic_cdk::storage::get_mut::<PrincipalToPrimaryMap>();
    let user_accounts = ic_cdk::storage::get_mut::<UserAccounts>();
    let linking_codes = ic_cdk::storage::get_mut::<LinkingCodes>();

    if principal_to_primary_map.contains_key(&caller) {
        return Err("This principal is already linked to an account".to_string());
    }

    let linking_code = linking_codes
        .remove(&code)
        .ok_or_else(|| "Invalid or expired linking code".to_string())?;

    if time() > linking_code.expiry_time {
        return Err("Linking code expired".to_string());
    }

    let primary_principal = linking_code.primary_principal;

    let user_account = user_accounts
        .get_mut(&primary_principal)
        .ok_or_else(|| "Target user account not found".to_string())?;

    user_account.linked_principals.push(caller);
    principal_to_primary_map.insert(caller, primary_principal);

    Ok(())
}

#[update]
fn unlink_device(principal_to_unlink: Principal) -> Result<(), String> {
    let caller = caller();
    let principal_to_primary_map = ic_cdk::storage::get_mut::<PrincipalToPrimaryMap>();
    let user_accounts = ic_cdk::storage::get_mut::<UserAccounts>();

    let primary_principal = principal_to_primary_map
        .get(&caller)
        .ok_or_else(|| "Caller not associated with any account".to_string())?;

    let user_account = user_accounts
        .get_mut(primary_principal)
        .ok_or_else(|| "User account not found".to_string())?;

    if user_account.linked_principals.len() <= 1 {
        return Err("Cannot unlink the last principal from an account".to_string());
    }

    let initial_len = user_account.linked_principals.len();
    user_account.linked_principals.retain(|&p| p != principal_to_unlink);

    if user_account.linked_principals.len() == initial_len {
        return Err("Principal not found in linked principals".to_string());
    }

    principal_to_primary_map.remove(&principal_to_unlink);

    Ok(())
}

#[update]
fn update_profile_from_ghost(target_principal: Principal, ghost_profile_data: Profile) -> Result<(), String> {
    // TODO: Replace with actual families canister ID after deployment
    let families_canister_id = Principal::from_text("aaaaa-aa").expect("Could not decode families canister ID"); 

    if caller() != families_canister_id {
        return Err("Unauthorized: Only the families canister can call this function".to_string());
    }

    let principal_to_primary_map = ic_cdk::storage::get_mut::<PrincipalToPrimaryMap>();
    let user_accounts = ic_cdk::storage::get_mut::<UserAccounts>();

    let primary_principal = principal_to_primary_map
        .get(&target_principal)
        .ok_or_else(|| "Target principal not associated with any account".to_string())?;

    let user_account = user_accounts
        .get_mut(primary_principal)
        .ok_or_else(|| "User account not found for target principal".to_string())?;

    user_account.profile = ghost_profile_data;

    Ok(())
}

#[query]
fn is_registered_user(principal: Principal) -> bool {
    let principal_to_primary_map = ic_cdk::storage::get::<PrincipalToPrimaryMap>();
    principal_to_primary_map.contains_key(&principal)
}

#[query]
fn get_linked_principals() -> Result<Vec<Principal>, String> {
    let user_account = get_user_account_for_caller()?;
    Ok(user_account.linked_principals)
}
