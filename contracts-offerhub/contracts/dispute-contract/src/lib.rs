#![no_std]

mod access;
mod contract;
mod storage;
mod test;
mod types;

use crate::types::{DisputeData, DisputeOutcome, Error, Evidence, ArbitratorData};
use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

#[contract]
pub struct DisputeResolutionContract;

#[contractimpl]
impl DisputeResolutionContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        default_timeout: u64,
        escrow_contract: Address,
        fee_manager: Address,
    ) -> Result<(), Error> {
        contract::initialize(&env, admin, default_timeout, escrow_contract, fee_manager);
        Ok(())
    }

    pub fn open_dispute(
        env: Env,
        job_id: u32,
        initiator: Address,
        reason: String,
        escrow_contract: Option<Address>,
        dispute_amount: i128,
    ) -> Result<(), Error> {
        contract::open_dispute(&env, job_id, initiator, reason, escrow_contract, dispute_amount);
        Ok(())
    }

    pub fn get_dispute(env: Env, job_id: u32) -> Result<DisputeData, Error> {
        Ok(contract::get_dispute(&env, job_id))
    }

    pub fn add_evidence(
        env: Env,
        job_id: u32,
        submitter: Address,
        description: String,
        attachment_hash: Option<String>,
    ) -> Result<(), Error> {
        contract::add_evidence(&env, job_id, submitter, description, attachment_hash);
        Ok(())
    }

    pub fn assign_mediator(
        env: Env,
        job_id: u32,
        admin: Address,
        mediator: Address,
    ) -> Result<(), Error> {
        contract::assign_mediator(&env, job_id, admin, mediator);
        Ok(())
    }

    pub fn escalate_to_arbitration(
        env: Env,
        job_id: u32,
        mediator: Address,
        arbitrator: Address,
    ) -> Result<(), Error> {
        contract::escalate_to_arbitration(&env, job_id, mediator, arbitrator);
        Ok(())
    }

    pub fn resolve_dispute(env: Env, job_id: u32, decision: DisputeOutcome) -> Result<(), Error> {
        contract::resolve_dispute(&env, job_id, decision);
        Ok(())
    }

    pub fn resolve_dispute_with_auth(
        env: Env,
        job_id: u32,
        decision: DisputeOutcome,
        caller: Address,
    ) -> Result<(), Error> {
        contract::resolve_dispute_with_auth(&env, job_id, decision, caller);
        Ok(())
    }

    pub fn check_timeout(env: Env, job_id: u32) -> Result<bool, Error> {
        Ok(contract::check_timeout(&env, job_id))
    }

    pub fn get_dispute_evidence(env: Env, job_id: u32) -> Result<Vec<Evidence>, Error> {
        Ok(contract::get_dispute_evidence(&env, job_id))
    }

    pub fn set_dispute_timeout(env: Env, admin: Address, timeout_seconds: u64) -> Result<(), Error> {
        contract::set_dispute_timeout(&env, admin, timeout_seconds);
        Ok(())
    }

    // Arbitrator management functions
    pub fn add_arbitrator(
        env: Env,
        admin: Address,
        arbitrator: Address,
        name: String,
    ) -> Result<(), Error> {
        access::add_arbitrator(&env, admin, arbitrator, name)
    }

    pub fn remove_arbitrator(
        env: Env,
        admin: Address,
        arbitrator: Address,
    ) -> Result<(), Error> {
        access::remove_arbitrator(&env, admin, arbitrator)
    }

    pub fn add_mediator_access(
        env: Env,
        admin: Address,
        mediator: Address,
    ) -> Result<(), Error> {
        access::add_mediator(&env, admin, mediator)
    }

    pub fn remove_mediator_access(
        env: Env,
        admin: Address,
        mediator: Address,
    ) -> Result<(), Error> {
        access::remove_mediator(&env, admin, mediator)
    }

    pub fn get_arbitrators(env: Env) -> Result<Vec<ArbitratorData>, Error> {
        Ok(access::get_arbitrators(&env))
    }

    pub fn get_mediators(env: Env) -> Result<Vec<Address>, Error> {
        Ok(access::get_mediators(&env))
    }
}
