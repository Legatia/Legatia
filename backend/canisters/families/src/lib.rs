use candid::{CandidType, Principal};
use ic_cdk::{api::caller, update, query};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

// Define Profile struct for cross-canister call
#[derive(Clone, Debug, Default, CandidType, Serialize, Deserialize)]
struct Profile {
    name: String,
    sex: String,
    birthday: String,
    birthplace: String,
    photo: Vec<u8>,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct Member {
    principal: Principal,
    is_admin: bool,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct GhostMember {
    id: u64,
    name: String,
    birthday: String,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct Family {
    id: u64,
    name: String,
    members: BTreeMap<Principal, Member>,
    ghost_members: BTreeMap<u64, GhostMember>,
    next_ghost_id: u64,
}

type FamilyStore = BTreeMap<u64, Family>;

fn is_admin(family: &Family, principal: &Principal) -> bool {
    family.members.get(principal).map_or(false, |m| m.is_admin)
}

#[update]
fn create_family(name: String) -> u64 {
    let caller = caller();
    let family_store = ic_cdk::storage::get_mut::<FamilyStore>();
    let id = family_store.len() as u64;

    let mut members = BTreeMap::new();
    members.insert(
        caller,
        Member {
            principal: caller,
            is_admin: true,
        },
    );

    let family = Family {
        id,
        name,
        members,
        ghost_members: BTreeMap::new(),
        next_ghost_id: 0,
    };

    family_store.insert(id, family);
    id
}

#[update]
fn add_member(family_id: u64, principal: Principal) -> Result<(), String> {
    let caller = caller();
    let family_store = ic_cdk::storage::get_mut::<FamilyStore>();
    let family = family_store
        .get_mut(&family_id)
        .ok_or_else(|| "Family not found".to_string())?;

    if !is_admin(family, &caller) {
        return Err("Only admins can add members".to_string());
    }

    family.members.insert(
        principal,
        Member {
            principal,
            is_admin: false,
        },
    );

    Ok(())
}

#[update]
fn transfer_adminship(family_id: u64, new_admin: Principal) -> Result<(), String> {
    let caller = caller();
    let family_store = ic_cdk::storage::get_mut::<FamilyStore>();
    let family = family_store
        .get_mut(&family_id)
        .ok_or_else(|| "Family not found".to_string())?;

    if !is_admin(family, &caller) {
        return Err("Only admins can transfer adminship".to_string());
    }

    let new_admin_member = family
        .members
        .get_mut(&new_admin)
        .ok_or_else(|| "New admin not in family".to_string())?;

    new_admin_member.is_admin = true;

    let old_admin_member = family.members.get_mut(&caller).unwrap();
    old_admin_member.is_admin = false;

    Ok(())
}

#[update]
fn add_ghost_member(family_id: u64, name: String, birthday: String) -> Result<u64, String> {
    let caller = caller();
    let family_store = ic_cdk::storage::get_mut::<FamilyStore>();
    let family = family_store
        .get_mut(&family_id)
        .ok_or_else(|| "Family not found".to_string())?;

    if !is_admin(family, &caller) {
        return Err("Only admins can add ghost members".to_string());
    }

    let ghost_id = family.next_ghost_id;
    let ghost_member = GhostMember {
        id: ghost_id,
        name,
        birthday,
    };

    family.ghost_members.insert(ghost_id, ghost_member);
    family.next_ghost_id += 1;

    Ok(ghost_id)
}

#[update]
async fn claim_ghost_profile(family_id: u64, name: String, birthday: String) -> Result<(), String> {
    let caller = caller();
    let family_store = ic_cdk::storage::get_mut::<FamilyStore>();
    let family = family_store
        .get_mut(&family_id)
        .ok_or_else(|| "Family not found".to_string())?;

    let mut ghost_to_claim = None;
    for (id, ghost) in family.ghost_members.iter() {
        if ghost.name == name && ghost.birthday == birthday {
            ghost_to_claim = Some(*id);
            break;
        }
    }

    if let Some(ghost_id) = ghost_to_claim {
        let ghost_member = family.ghost_members.remove(&ghost_id).unwrap();

        // Construct a Profile from the ghost data
        let ghost_profile_data = Profile {
            name: ghost_member.name,
            sex: "Unknown".to_string(), // Default value, can be updated by user later
            birthday: ghost_member.birthday,
            birthplace: "Unknown".to_string(), // Default value
            photo: Vec::new(), // Default empty photo
        };

        // Make cross-canister call to profiles canister
        let profiles_canister_id = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai") // Placeholder ID
            .expect("Could not decode profiles canister ID");

        let call_result: Result<(Result<(), String>,), _> = ic_cdk::call(
            profiles_canister_id,
            "update_profile_from_ghost",
            (caller, ghost_profile_data),
        )
        .await;

        match call_result {
            Ok((res,)) => {
                if res.is_ok() {
                    family.members.insert(
                        caller,
                        Member {
                            principal: caller,
                            is_admin: false,
                        },
                    );
                    Ok(())
                } else {
                    Err(format!("Failed to update profile from ghost: {}", res.unwrap_err()))
                }
            }
            Err((code, msg)) => Err(format!("Cross-canister call failed: {:?} {}", code, msg)),
        }
    } else {
        Err("No matching ghost profile found".to_string())
    }
}

#[update]
fn add_member_by_invite(
    family_id: u64,
    new_member_principal: Principal,
    inviter_principal: Principal,
) -> Result<(), String> {
    let family_store = ic_cdk::storage::get_mut::<FamilyStore>();
    let family = family_store
        .get_mut(&family_id)
        .ok_or_else(|| "Family not found".to_string())?;

    // Verify that the inviter is a member of the family
    if !family.members.contains_key(&inviter_principal) {
        return Err("Inviter is not a member of this family".to_string());
    }

    // Add the new member
    family.members.insert(
        new_member_principal,
        Member {
            principal: new_member_principal,
            is_admin: false,
        },
    );

    Ok(())
}

#[query]
fn get_family(family_id: u64) -> Result<Family, String> {
    let family_store = ic_cdk::storage::get::<FamilyStore>();
    family_store
        .get(&family_id)
        .cloned()
        .ok_or_else(|| "Family not found".to_string())
}