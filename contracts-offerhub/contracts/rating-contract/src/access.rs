use crate::storage::{get_admin, is_moderator, save_moderator, remove_moderator as remove_moderator_storage};
use crate::types::{Error, require_auth};
use soroban_sdk::{Address, Env};

pub fn check_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    require_auth(caller)?;
    let admin = get_admin(env);
    if *caller != admin {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

pub fn check_moderator(env: &Env, caller: &Address) -> Result<(), Error> {
    require_auth(caller)?;
    if !is_admin_or_moderator(env, caller) {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

pub fn is_admin_or_moderator(env: &Env, address: &Address) -> bool {
    let admin = get_admin(env);
    *address == admin || is_moderator(env, address)
}

pub fn add_moderator(env: &Env, caller: &Address, moderator: &Address) -> Result<(), Error> {
    check_admin(env, caller)?;
    
    if is_moderator(env, moderator) {
        return Err(Error::AlreadyModerator);
    }
    
    save_moderator(env, moderator);
    Ok(())
}

pub fn remove_moderator(env: &Env, caller: &Address, moderator: &Address) -> Result<(), Error> {
    check_admin(env, caller)?;
    
    if !is_moderator(env, moderator) {
        return Err(Error::NotModerator);
    }
    
    remove_moderator_storage(env, moderator);
    Ok(())
}

pub fn transfer_admin(env: &Env, caller: &Address, new_admin: &Address) -> Result<(), Error> {
    check_admin(env, caller)?;
    crate::storage::save_admin(env, new_admin);
    Ok(())
}
