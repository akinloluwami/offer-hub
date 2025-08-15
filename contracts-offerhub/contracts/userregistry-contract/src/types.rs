use soroban_sdk::{contracterror, contracttype, Address, Env, String};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    Unauthorized = 1,
    AlreadyRegistered = 2,
    UserNotFound = 3,
    AlreadyBlacklisted = 4,
    NotBlacklisted = 5,
    InvalidVerificationLevel = 6,
    VerificationExpired = 7,
    NotInitialized = 8,
    AlreadyInitialized = 9,
    CannotBlacklistAdmin = 10,
    CannotBlacklistModerator = 11,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VerificationLevel {
    Basic = 1,
    Premium = 2,
    Enterprise = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserProfile {
    pub verification_level: VerificationLevel,
    pub verified_at: u64,
    pub expires_at: u64, // 0 means no expiration
    pub metadata: String,
    pub is_blacklisted: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStatus {
    pub is_verified: bool,
    pub verification_level: VerificationLevel,
    pub is_blacklisted: bool,
    pub verification_expires_at: u64, // 0 means no expiration
    pub is_expired: bool,
}

pub fn require_auth(_env: &Env, address: &Address) -> Result<(), Error> {
    address.require_auth();
    Ok(())
} 