use crate::types::{DisputeResult, EscrowStatus};
use crate::{EscrowContract, EscrowContractClient};
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

#[contract]
pub struct MockTokenContract;

#[contractimpl]
impl MockTokenContract {
    pub fn balance(_env: Env, _addr: Address) -> i128 {
        1000
    }
    pub fn transfer(_env: Env, _from: Address, _to: Address, _amount: i128) {}
}

fn setup_token(env: &Env) -> Address {
    let token_id = Address::generate(env);
    env.register_contract(&token_id, MockTokenContract);
    token_id
}

fn setup_env() -> Env {
    let env = Env::default();
    env.ledger().with_mut(|l| l.timestamp = 1000);
    env
}

#[test]
fn test_deposit_and_release_token() {
    let env = setup_env();
    env.mock_all_auths();

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let token = setup_token(&env);
    let amount = 500;
    let timeout = 100;

    contract.init_contract_full(&client, &freelancer, &arbitrator, &token, &amount, &timeout);
    contract.deposit_funds(&client);
    let data = env.as_contract(&contract_id, || crate::contract::get_escrow_data(&env));
    assert_eq!(data.status, EscrowStatus::Funded);

    contract.release_funds(&freelancer);
    let data = env.as_contract(&contract_id, || crate::contract::get_escrow_data(&env));
    assert_eq!(data.status, EscrowStatus::Released);
}

#[test]
#[should_panic]
fn test_deposit_insufficient_balance() {
    let env = setup_env();
    env.mock_all_auths();

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let token = setup_token(&env);
    let amount = 500_000_000; // purposely too high
    let timeout = 100;

    contract.init_contract_full(&client, &freelancer, &arbitrator, &token, &amount, &timeout);
    // Should panic on insufficient funds
    contract.deposit_funds(&client);
}

#[test]
#[should_panic]
fn test_resolve_dispute_arbitrator_only_panics_for_non_arbitrator() {
    let env = setup_env();
    env.mock_all_auths();

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let token = setup_token(&env);
    let amount = 500;
    let timeout = 100;

    contract.init_contract_full(&client, &freelancer, &arbitrator, &token, &amount, &timeout);
    contract.deposit_funds(&client);

    contract.dispute(&client);
    let data = crate::contract::get_escrow_data(&env);
    assert_eq!(data.status, EscrowStatus::Disputed);

    // This should panic because only the arbitrator can resolve
    contract.resolve_dispute(&client, &Symbol::new(&env, "client_wins"));
}

#[test]
#[should_panic]
fn test_resolve_dispute_panics_for_non_arbitrator() {
    let env = setup_env();
    env.mock_all_auths();

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let token = setup_token(&env);
    let amount = 500;
    let timeout = 100;

    contract.init_contract_full(&client, &freelancer, &arbitrator, &token, &amount, &timeout);
    contract.deposit_funds(&client);
    contract.dispute(&client);

    // This should panic because only the arbitrator can resolve
    contract.resolve_dispute(&client, &Symbol::new(&env, "client_wins"));
}

#[test]
#[should_panic]
fn test_resolve_dispute_unauthorized() {
    let env = setup_env();
    env.mock_all_auths();

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let token = setup_token(&env);
    let amount = 500;
    let timeout = 100;

    contract.init_contract_full(&client, &freelancer, &arbitrator, &token, &amount, &timeout);
    contract.deposit_funds(&client);

    contract.dispute(&client);
    let data = crate::contract::get_escrow_data(&env);
    assert_eq!(data.status, EscrowStatus::Disputed);

    // Client tries to resolve dispute (should panic)
    contract.resolve_dispute(&client, &Symbol::new(&env, "client_wins"));
}

#[test]
fn test_auto_release_after_timeout() {
    let env = setup_env();
    env.mock_all_auths();

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let token = setup_token(&env);
    let amount = 500;
    let timeout = 100;

    contract.init_contract_full(&client, &freelancer, &arbitrator, &token, &amount, &timeout);
    contract.deposit_funds(&client);

    // Advance time
    env.ledger().with_mut(|l| l.timestamp += timeout + 1);

    contract.auto_release();
    let data = env.as_contract(&contract_id, || crate::contract::get_escrow_data(&env));
    assert_eq!(data.status, EscrowStatus::Released);
}

#[test]
#[should_panic]
fn test_auto_release_panics_if_not_timed_out() {
    let env = setup_env();
    env.mock_all_auths();

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let token = setup_token(&env);
    let amount = 500;
    let timeout = 100;

    contract.init_contract_full(&client, &freelancer, &arbitrator, &token, &amount, &timeout);
    contract.deposit_funds(&client);

    // Not yet timed out, should panic
    contract.auto_release();
}

#[test]
fn test_init_contract_compatibility() {
    let env = setup_env();
    env.mock_all_auths();

    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, EscrowContract);
    let contract = EscrowContractClient::new(&env, &contract_id);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);
    let fee_manager = Address::generate(&env);

    contract.init_contract(&client, &freelancer, &1000, &fee_manager);
    let data = env.as_contract(&contract_id, || crate::contract::get_escrow_data(&env));
    assert_eq!(data.client, client);
    assert_eq!(data.freelancer, freelancer);
    assert_eq!(data.amount, 1000);
    assert_eq!(data.fee_manager, fee_manager);
}
