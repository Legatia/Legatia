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
        .push(relationship.clone());

    // Also add the inverse relationship for easier lookup
    let inverse_relationship_type = match relationship.relationship_type {
        RelationshipType::Parent => RelationshipType::Child,
        RelationshipType::Child => RelationshipType::Parent,
        RelationshipType::Spouse => RelationshipType::Spouse,
        RelationshipType::Sibling => RelationshipType::Sibling,
        RelationshipType::Other => RelationshipType::Other,
    };

    let inverse_relationship = Relationship {
        from_principal: to_principal,
        to_principal: caller,
        relationship_type: inverse_relationship_type,
        custom_relationship: relationship.custom_relationship,
    };

    relationship_store
        .entry(to_principal)
        .or_default()
        .push(inverse_relationship);

    Ok(())
}

#[query]
fn get_relationships_for_user(principal: Principal) -> Vec<Relationship> {
    let relationship_store = ic_cdk::storage::get::<RelationshipStore>();
    relationship_store
        .get(&principal)
        .cloned()
        .unwrap_or_default()
}