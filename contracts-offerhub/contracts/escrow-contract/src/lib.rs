#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};

mod contract;
mod error;
mod storage;
mod types;

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn init_contract(
        env: Env,
        client: Address,
        freelancer: Address,
        amount: i128,
        fee_manager: Address,
    ) {
        contract::init_contract(&env, client, freelancer, amount, fee_manager);
    }

    pub fn deposit_funds(env: Env, client: Address) {
        contract::deposit_funds(&env, client);
    }

    pub fn release_funds(env: Env, freelancer: Address) {
        contract::release_funds(&env, freelancer);
    }

    pub fn dispute(env: Env, caller: Address) {
        contract::dispute(&env, caller);
    }

    pub fn resolve_dispute(env: Env, caller: Address, result: Symbol) {
        contract::resolve_dispute(&env, caller, result);
    }

    pub fn init_contract_full(
        env: Env,
        client: Address,
        freelancer: Address,
        arbitrator: Address,
        token: Address,
        amount: i128,
        timeout_secs: u64,
    ) {
        contract::init_contract_full(
            &env,
            client,
            freelancer,
            arbitrator,
            token,
            amount,
            timeout_secs,
        );
    }

    pub fn auto_release(env: Env) {
        contract::auto_release(&env);
    }

    pub fn get_escrow_data(env: Env) -> types::EscrowData {
        contract::get_escrow_data(&env)
    }
    pub fn test_set_dispute_result(env: Env, result: u32) {
        let mut data = contract::get_escrow_data(&env);
        data.dispute_result = result;
        contract::set_escrow_data(&env, &data);
    }
}

#[cfg(test)]
mod test;
