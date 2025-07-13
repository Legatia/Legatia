use ic_agent::agent::http_transport::ReqwestHttpReplicaV2Transport as ReqwestHttpReplicaTransport;
use ic_agent::polling::Delay;
use ic_agent::{Agent, export::Principal};
use candid::{Encode, Decode, CandidType, Deserialize};
use std::time::Duration;

#[derive(CandidType, Deserialize, Debug, Clone)]
struct Profile {
    user_id: String,
    name: String,
    surname: String,
    family_id: Option<String>,
    email: String,
}

#[tokio::main]
async fn main() {
    let transport = ReqwestHttpReplicaTransport::create("http://127.0.0.1:8000").expect("Failed to create transport");

    let agent = Agent::builder()
        .with_transport(transport)
        .build()
        .expect("Failed to create agent");

    // Replace with your actual canister IDs after deployment
    let profiles_canister_id_str = "YOUR_PROFILES_CANISTER_ID";
    let families_canister_id_str = "YOUR_FAMILIES_CANISTER_ID";

    if profiles_canister_id_str == "YOUR_PROFILES_CANISTER_ID" || families_canister_id_str == "YOUR_FAMILIES_CANISTER_ID" {
        println!("Please replace YOUR_PROFILES_CANISTER_ID and YOUR_FAMILIES_CANISTER_ID in src/main.rs");
        return;
    }

    let profiles_canister_id = Principal::from_text(profiles_canister_id_str).unwrap();
    let families_canister_id = Principal::from_text(families_canister_id_str).unwrap();

    // --- Create a profile ---
    let args = Encode!(&"Alice".to_string(), &"Smith".to_string(), &"alice@example.com".to_string(), &true).unwrap();

    let waiter = Delay::new(Duration::from_secs(1), Duration::from_secs(60));
    let response = agent.update(&profiles_canister_id, "create_profile")
        .with_arg(&args)
        .call_and_wait(waiter)
        .await
        .expect("Failed to create profile");

    let created_profile = Decode!(&response, Profile).unwrap();
    println!("Profile created: {:?}", created_profile);
    let user_id = created_profile.user_id.clone();

    // --- Get the profile ---
    let args = Encode!(&user_id).unwrap();

    let result_bytes = agent.query(&profiles_canister_id, "get_profile")
        .with_arg(&args)
        .call()
        .await
        .expect("Failed to query profile");

    let profile_result: Option<Profile> = Decode!(&result_bytes, Option<Profile>).unwrap();
    assert!(profile_result.is_some());
    println!("Profile found: {:?}", profile_result.unwrap());

    // --- Create a family ---
    let family_args = Encode!(&user_id, &"Smith Family".to_string()).unwrap();

    let waiter = Delay::new(Duration::from_secs(1), Duration::from_secs(60));
    let response = agent.update(&families_canister_id, "create_family")
        .with_arg(&family_args)
        .call_and_wait(waiter)
        .await
        .expect("Failed to create family");

    let family_id_result = Decode!(&response, Result<String, String>).unwrap();
    match family_id_result {
        Ok(family_id) => {
            println!("Family created with ID: {}", family_id);
        }
        Err(e) => panic!("Failed to create family: {}", e),
    }

    println!("Test finished successfully!");
}
