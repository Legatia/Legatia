use ic_cdk::{query, update};
use std::cell::RefCell;

thread_local! {
    static RELATIONSHIP: RefCell<Option<String>> = RefCell::new(None);
}

#[query]
fn get_relationship() -> Option<String> {
    RELATIONSHIP.with(|relationship| (*relationship.borrow()).clone())
}

#[update]
fn set_relationship(relationship: String) {
    RELATIONSHIP.with(|r| *r.borrow_mut() = Some(relationship));
}
