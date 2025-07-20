use ic_cdk::{query, update};
use std::cell::RefCell;

thread_local! {
    static PROFILE: RefCell<Option<String>> = RefCell::new(None);
}

#[query]
fn get_profile() -> Option<String> {
    PROFILE.with(|profile| (*profile.borrow()).clone())
}

#[update]
fn set_profile(profile: String) {
    PROFILE.with(|p| *p.borrow_mut() = Some(profile));
}
