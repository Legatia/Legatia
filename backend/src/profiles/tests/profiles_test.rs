use super::*;
use ic_cdk::api::call::call;
use ic_cdk::export::candid::{candid_method, Principal};
use ic_cdk_macros::{query, update};
use ic_cdk_test::mock_canister_context;

mock_canister_context!();

#[test]
fn test_set_and_get_profile() {
    mock_canister_context::set_caller(Principal::anonymous());

    let profile_value = "Test Profile".to_string();
    set_profile(profile_value.clone());

    let retrieved_profile = get_profile();
    assert_eq!(retrieved_profile, Some(profile_value));
}
