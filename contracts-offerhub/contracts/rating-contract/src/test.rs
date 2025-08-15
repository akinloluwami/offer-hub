#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation}, Address, Env, String};

    fn create_contract(e: &Env) -> Address {
        e.register_contract(None, Contract)
    }

    #[test]
    fn test_init() {
        let env = Env::default();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        assert_eq!(client.get_admin(), admin);
    }

    #[test]
    fn test_submit_rating() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let rater = Address::generate(&env);
        let rated_user = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        let contract_work_id = String::from_str(&env, "contract_123");
        let feedback = String::from_str(&env, "Great work, delivered on time!");
        let work_category = String::from_str(&env, "web_development");

        client.submit_rating(&rater, &rated_user, &contract_work_id, &5u8, &feedback, &work_category);

        let stats = client.get_user_rating_stats(&rated_user);
        assert_eq!(stats.total_ratings, 1);
        assert_eq!(stats.average_rating, 500); // 5.00 * 100
        assert_eq!(stats.five_star_count, 1);
    }

    #[test]
    fn test_multiple_ratings_average() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let rater1 = Address::generate(&env);
        let rater2 = Address::generate(&env);
        let rater3 = Address::generate(&env);
        let rated_user = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        let feedback = String::from_str(&env, "Good work");
        let work_category = String::from_str(&env, "design");

        // Submit multiple ratings
        client.submit_rating(&rater1, &rated_user, &String::from_str(&env, "contract_1"), &5u8, &feedback, &work_category);
        client.submit_rating(&rater2, &rated_user, &String::from_str(&env, "contract_2"), &4u8, &feedback, &work_category);
        client.submit_rating(&rater3, &rated_user, &String::from_str(&env, "contract_3"), &3u8, &feedback, &work_category);

        let stats = client.get_user_rating_stats(&rated_user);
        assert_eq!(stats.total_ratings, 3);
        assert_eq!(stats.average_rating, 400); // (5+4+3)/3 = 4.00 * 100
        assert_eq!(stats.five_star_count, 1);
        assert_eq!(stats.four_star_count, 1);
        assert_eq!(stats.three_star_count, 1);
    }

    #[test]
    #[should_panic(expected = "Error(InvalidRating)")]
    fn test_invalid_rating() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let rater = Address::generate(&env);
        let rated_user = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        let contract_work_id = String::from_str(&env, "contract_123");
        let feedback = String::from_str(&env, "Test feedback");
        let work_category = String::from_str(&env, "test");

        // Try to submit invalid rating (6 stars)
        client.submit_rating(&rater, &rated_user, &contract_work_id, &6u8, &feedback, &work_category);
    }

    #[test]
    #[should_panic(expected = "Error(AlreadyRated)")]
    fn test_duplicate_rating() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let rater = Address::generate(&env);
        let rated_user = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        let contract_work_id = String::from_str(&env, "contract_123");
        let feedback = String::from_str(&env, "Great work!");
        let work_category = String::from_str(&env, "development");

        // Submit first rating
        client.submit_rating(&rater, &rated_user, &contract_work_id, &5u8, &feedback, &work_category);
        
        // Try to submit second rating for same contract
        client.submit_rating(&rater, &rated_user, &contract_work_id, &4u8, &feedback, &work_category);
    }

    #[test]
    fn test_user_privileges() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let rated_user = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        // Submit multiple high ratings to qualify for privileges
        let feedback = String::from_str(&env, "Excellent work!");
        let work_category = String::from_str(&env, "development");
        
        for i in 1..=25 {
            let rater = Address::generate(&env);
            let contract_id_str = String::from_str(&env, &format!("contract_{}", i));
            client.submit_rating(&rater, &rated_user, &contract_id_str, &5u8, &feedback, &work_category);
        }

        let privileges = client.get_user_privileges(&rated_user);
        assert!(privileges.len() > 0);
        
        // Should have top-rated privileges
        let has_top_rated = privileges.iter().any(|p| p.to_string() == "top_rated_badge");
        assert!(has_top_rated);
    }

    #[test]
    fn test_rating_restrictions() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let rated_user = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        // Submit multiple low ratings to trigger restrictions
        let feedback = String::from_str(&env, "Needs improvement");
        let work_category = String::from_str(&env, "development");
        
        for i in 1..=10 {
            let rater = Address::generate(&env);
            let contract_id_str = String::from_str(&env, &format!("contract_{}", i));
            client.submit_rating(&rater, &rated_user, &contract_id_str, &2u8, &feedback, &work_category);
        }

        let has_restrictions = client.has_restrictions(&rated_user);
        assert!(has_restrictions);
    }

    #[test]
    fn test_moderator_management() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let moderator = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        // Add moderator
        client.add_moderator(&admin, &moderator);

        // Test moderation functionality
        let rater = Address::generate(&env);
        let rated_user = Address::generate(&env);
        let feedback_id = String::from_str(&env, "feedback_123");
        let reason = String::from_str(&env, "Inappropriate content");

        client.report_feedback(&rater, &feedback_id, &reason);

        let action = String::from_str(&env, "remove");
        let mod_reason = String::from_str(&env, "Violated community guidelines");
        client.moderate_feedback(&moderator, &feedback_id, &action, &mod_reason);
    }

    #[test]
    fn test_incentives() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        // Submit ratings to qualify for incentives
        let feedback = String::from_str(&env, "Excellent!");
        let work_category = String::from_str(&env, "development");
        
        for i in 1..=15 {
            let rater = Address::generate(&env);
            let contract_id_str = String::from_str(&env, &format!("contract_{}", i));
            client.submit_rating(&rater, &user, &contract_id_str, &5u8, &feedback, &work_category);
        }

        let incentives = client.check_rating_incentives(&user);
        assert!(incentives.len() > 0);

        // Claim first available incentive
        if let Some(incentive) = incentives.first() {
            client.claim_incentive_reward(&user, incentive);
        }
    }

    #[test]
    fn test_platform_analytics() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        // Submit some ratings to generate analytics data
        let rater = Address::generate(&env);
        let rated_user = Address::generate(&env);
        let feedback = String::from_str(&env, "Good work");
        let work_category = String::from_str(&env, "design");

        client.submit_rating(&rater, &rated_user, &String::from_str(&env, "contract_1"), &4u8, &feedback, &work_category);

        let analytics = client.get_platform_analytics();
        assert!(analytics.len() > 0);
    }

    #[test]
    fn test_rating_thresholds() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        // Set custom threshold
        let threshold_type = String::from_str(&env, "custom_threshold");
        client.set_rating_threshold(&admin, &threshold_type, &350u32);

        // Test that threshold was set (this would need a getter in production)
        // For now, just verify the operation completed without error
    }

    #[test]
    fn test_user_rating_data() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = create_contract(&env);
        let admin = Address::generate(&env);
        let rated_user = Address::generate(&env);

        let client = ContractClient::new(&env, &contract_id);
        client.init(&admin);

        // Submit some ratings
        let feedback = String::from_str(&env, "Professional work");
        let work_category = String::from_str(&env, "consulting");
        
        for i in 1..=8 {
            let rater = Address::generate(&env);
            let contract_id_str = String::from_str(&env, &format!("contract_{}", i));
            let rating = if i <= 6 { 5u8 } else { 4u8 }; // Mix of ratings
            client.submit_rating(&rater, &rated_user, &contract_id_str, &rating, &feedback, &work_category);
        }

        let user_data = client.get_user_rating_data(&rated_user);
        assert_eq!(user_data.stats.total_ratings, 8);
        assert!(user_data.achievement_eligible.len() > 0);
        assert_eq!(user_data.restriction_status.to_string(), "none");
    }

    use crate::Contract as ContractType;
    use soroban_sdk::contractclient;

    #[contractclient(name = "ContractClient")]
    trait ContractClientTrait {
        fn init(e: Env, admin: Address) -> Result<(), Error>;
        fn submit_rating(
            e: Env,
            caller: Address,
            rated_user: Address,
            contract_id: String,
            rating: u8,
            feedback: String,
            work_category: String,
        ) -> Result<(), Error>;
        fn get_user_rating_stats(e: Env, user: Address) -> Result<RatingStats, Error>;
        fn get_user_feedback(e: Env, user: Address, limit: u32) -> Result<Vec<Feedback>, Error>;
        fn get_user_rating_data(e: Env, user: Address) -> Result<UserRatingData, Error>;
        fn has_restrictions(e: Env, user: Address) -> Result<bool, Error>;
        fn get_user_privileges(e: Env, user: Address) -> Result<Vec<String>, Error>;
        fn report_feedback(e: Env, caller: Address, feedback_id: String, reason: String) -> Result<(), Error>;
        fn moderate_feedback(e: Env, caller: Address, feedback_id: String, action: String, reason: String) -> Result<(), Error>;
        fn get_platform_analytics(e: Env) -> Result<Vec<(String, String)>, Error>;
        fn check_rating_incentives(e: Env, user: Address) -> Result<Vec<String>, Error>;
        fn claim_incentive_reward(e: Env, caller: Address, incentive_type: String) -> Result<(), Error>;
        fn update_reputation(e: Env, caller: Address, user: Address) -> Result<(), Error>;
        fn add_moderator(e: Env, caller: Address, moderator: Address) -> Result<(), Error>;
        fn remove_moderator(e: Env, caller: Address, moderator: Address) -> Result<(), Error>;
        fn set_rating_threshold(e: Env, caller: Address, threshold_type: String, value: u32) -> Result<(), Error>;
        fn get_admin(e: Env) -> Result<Address, Error>;
        fn transfer_admin(e: Env, caller: Address, new_admin: Address) -> Result<(), Error>;
    }
}
