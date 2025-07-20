use ic_cdk::{query, update};
use std::cell::RefCell;

thread_local! {
    static FAMILY: RefCell<Option<String>> = RefCell::new(None);
}

#[query]
fn get_family() -> Option<String> {
    FAMILY.with(|family| (*family.borrow()).clone())
}

#[update]
fn set_family(family: String) {
    FAMILY.with(|f| *f.borrow_mut() = Some(family));
}
