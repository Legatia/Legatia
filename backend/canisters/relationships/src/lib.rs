use candid::{CandidType, Principal};
use ic_cdk::{api::caller, query, update};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Clone, Debug, CandidType, Serialize, Deserialize, PartialEq, Eq)]
enum RelationshipType {
    Parent,
    Child,
    Spouse,
    Sibling,
    Other,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct Relationship {
    from_principal: Principal,
    to_principal: Principal,
    relationship_type: RelationshipType,
    custom_relationship: Option<String>,
}

type RelationshipStore = BTreeMap<Principal, Vec<Relationship>>;

#[update]
fn add_relationship(
    to_principal: Principal,
    relationship_type: RelationshipType,
    custom_relationship: Option<String>,
) -> Result<(), String> {
    let caller = caller();
    let relationship_store = ic_cdk::storage::get_mut::<RelationshipStore>();

    let relationship = Relationship {
        from_principal: caller,
        to_principal,
        relationship_type,
        custom_relationship,
    };

    relationship_store
        .entry(caller)
        .or_default()
        .push(relationship);

    Ok(())
}

#[update]
async fn remove_relationship(
    to_principal: Principal,
    relationship_type: RelationshipType,
) -> Result<(), String> {
    let caller = caller();
    let relationship_store = ic_cdk::storage::get_mut::<RelationshipStore>();

    // Placeholder for profiles canister ID - MUST BE UPDATED AFTER DEPLOYMENT
    let profiles_canister_id = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai")
        .expect("Could not decode profiles canister ID");

    // Check if to_principal is a registered user
    let call_result: Result<(bool,), _> = ic_cdk::call(
        profiles_canister_id,
        "is_registered_user",
        (to_principal,),
    )
    .await;

    let is_registered = match call_result {
        Ok((res,)) => res,
        Err((code, msg)) => return Err(format!("Cross-canister call to profiles failed: {:?} {}", code, msg)),
    };

    if is_registered {
        return Err("Cannot unilaterally remove relationship with a registered user. Mutual agreement is required.".to_string());
    }

    // If not a registered user (ghost), proceed with unilateral removal
    let relationships = relationship_store
        .get_mut(&caller)
        .ok_or_else(|| "No relationships found for caller".to_string())?;

    let initial_len = relationships.len();
    relationships.retain(|r| !(r.to_principal == to_principal && r.relationship_type == relationship_type));

    if relationships.len() == initial_len {
        Err("Relationship not found".to_string())
    } else {
        Ok(())
    }
}

#[update]
fn update_relationship(
    to_principal: Principal,
    old_relationship_type: RelationshipType,
    new_relationship_type: RelationshipType,
    new_custom_relationship: Option<String>,
) -> Result<(), String> {
    let caller = caller();
    let relationship_store = ic_cdk::storage::get_mut::<RelationshipStore>();

    let relationships = relationship_store
        .get_mut(&caller)
        .ok_or_else(|| "No relationships found for caller".to_string())?;

    let mut found = false;
    for r in relationships.iter_mut() {
        if r.to_principal == to_principal && r.relationship_type == old_relationship_type {
            r.relationship_type = new_relationship_type;
            r.custom_relationship = new_custom_relationship;
            found = true;
            break;
        }
    }

    if found {
        Ok(())
    } else {
        Err("Relationship not found".to_string())
    }
}

#[query]
fn get_relationships_for_user(principal: Principal) -> Vec<Relationship> {
    let relationship_store = ic_cdk::storage::get::<RelationshipStore>();
    relationship_store
        .get(&principal)
        .cloned()
        .unwrap_or_default()
}