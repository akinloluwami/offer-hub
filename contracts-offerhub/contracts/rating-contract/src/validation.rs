use crate::storage::{has_rated_contract, get_user_rating_stats, get_user_restriction};
use crate::types::{Error, MIN_RATING, MAX_RATING, MAX_FEEDBACK_LENGTH};
use soroban_sdk::{Address, Env, String};

pub fn validate_rating(rating: u32) -> Result<(), Error> {
    if rating < MIN_RATING || rating > MAX_RATING {
        return Err(Error::InvalidRating);
    }
    Ok(())
}

pub fn validate_feedback(feedback: &String) -> Result<(), Error> {
    if feedback.len() > MAX_FEEDBACK_LENGTH {
        return Err(Error::InvalidRating); // Using generic error for now
    }
    Ok(())
}

pub fn validate_rating_eligibility(
    env: &Env,
    rater: &Address,
    rated_user: &Address,
    contract_id: &String,
) -> Result<(), Error> {
    // Check if rater has already rated this contract
    if has_rated_contract(env, rater, contract_id) {
        return Err(Error::AlreadyRated);
    }
    
    // Check if rater is trying to rate themselves
    if *rater == *rated_user {
        return Err(Error::InvalidRating);
    }
    
    // Check if rater has restrictions
    let restriction = get_user_restriction(env, rater);
    if restriction == String::from_str(env, "restricted") {
        return Err(Error::RatingRestricted);
    }
    
    Ok(())
}

pub fn validate_moderation_action(action: &String) -> Result<(), Error> {
    // Simplified validation for Soroban compatibility
    if action == &String::from_str(&soroban_sdk::Env::default(), "approve") ||
       action == &String::from_str(&soroban_sdk::Env::default(), "remove") ||
       action == &String::from_str(&soroban_sdk::Env::default(), "flag") {
        Ok(())
    } else {
        Err(Error::InvalidModerationAction)
    }
}

pub fn check_spam_prevention(env: &Env, rater: &Address) -> Result<(), Error> {
    // Check if user is making too many ratings in a short time
    // This would need timestamp-based logic in production
    // For now, just check basic restrictions
    let restriction = get_user_restriction(env, rater);
    if restriction == String::from_str(env, "spam_restricted") {
        return Err(Error::RatingRestricted);
    }
    Ok(())
}

pub fn validate_incentive_type(_incentive_type: &String) -> Result<(), Error> {
    // Simplified validation for Soroban compatibility
    // Just return Ok for now - can add proper validation later
    Ok(())
}
