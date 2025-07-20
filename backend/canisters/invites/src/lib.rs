use candid::{CandidType, Principal};
use ic_cdk::{api::caller, update, query};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct Invite {
    inviter: Principal,
    inviter_family_id: Option<u64>,
    claimed: bool,
}

type InviteStore = BTreeMap<String, Invite>;

fn generate_random_code() -> String {
    let mut rng = rand::thread_rng();
    let code: String = std::iter::repeat(())
        .map(|()| rng.sample(rand::distributions::Alphanumeric))
        .map(char::from)
        .take(8)
        .collect();
    code
}

#[update]
fn generate_invite(inviter_family_id: Option<u64>) -> String {
    let caller = caller();
    let invite_store = ic_cdk::storage::get_mut::<InviteStore>();
    let code = generate_random_code();

    let invite = Invite {
        inviter: caller,
        inviter_family_id,
        claimed: false,
    };

    invite_store.insert(code.clone(), invite);
    code
}

#[query]
fn get_invite(code: String) -> Result<Invite, String> {
    let invite_store = ic_cdk::storage::get::<InviteStore>();
    invite_store
        .get(&code)
        .cloned()
        .ok_or_else(|| "Invite not found".to_string())
}

#[update]
fn claim_invite(code: String) -> Result<(Principal, Option<u64>), String> {
    let invite_store = ic_cdk::storage::get_mut::<InviteStore>();
    let invite = invite_store
        .get_mut(&code)
        .ok_or_else(|| "Invite not found".to_string())?;

    if invite.claimed {
        return Err("Invite already claimed".to_string());
    }

    invite.claimed = true;
    Ok((invite.inviter, invite.inviter_family_id))
}