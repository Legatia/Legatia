use ic_cdk::{query, update};
use std::cell::RefCell;

thread_local! {
    static INVITE: RefCell<Option<String>> = RefCell::new(None);
}

#[query]
fn get_invite() -> Option<String> {
    INVITE.with(|invite| (*invite.borrow()).clone())
}

#[update]
fn set_invite(invite: String) {
    INVITE.with(|i| *i.borrow_mut() = Some(invite));
}
