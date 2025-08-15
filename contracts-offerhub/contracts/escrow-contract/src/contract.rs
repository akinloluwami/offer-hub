use soroban_sdk::{Address, Env, IntoVal, String, Symbol, Vec};

use crate::{
    error::handle_error,
    storage::{ESCROW_DATA, INITIALIZED},
    types::{DisputeResult, Error, EscrowData, EscrowStatus, Milestone, MilestoneHistory},
};

const TOKEN_TRANSFER: &str = "transfer";
const TOKEN_BALANCE: &str = "balance";

pub fn init_contract_full(
    env: &Env,
    client: Address,
    freelancer: Address,
    arbitrator: Address,
    token: Address,
    amount: i128,
    timeout_secs: u64,
) {
    if env.storage().instance().has(&INITIALIZED) {
        handle_error(env, Error::AlreadyInitialized);
    }
    if amount <= 0 {
        handle_error(env, Error::InvalidAmount);
    }
    let escrow_data = EscrowData {
        client: client.clone(),
        freelancer,
        arbitrator: Some(arbitrator),
        token: Some(token),
        amount,
        status: EscrowStatus::Initialized,
        dispute_result: DisputeResult::None as u32,
        created_at: env.ledger().timestamp(),
        funded_at: None,
        released_at: None,
        disputed_at: None,
        resolved_at: None,
        timeout_secs: Some(timeout_secs),
        milestones: Vec::new(env),
        milestone_history: Vec::new(env),
        released_amount: 0,
        fee_manager: client, // now you can use client here
        fee_collected: 0,
        net_amount: amount,
    };
    env.storage().instance().set(&ESCROW_DATA, &escrow_data);
    env.storage().instance().set(&INITIALIZED, &true);
}

pub fn init_contract(
    env: &Env,
    client: Address,
    freelancer: Address,
    amount: i128,
    fee_manager: Address,
) {
    if env.storage().instance().has(&INITIALIZED) {
        handle_error(env, Error::AlreadyInitialized);
    }

    if amount <= 0 {
        handle_error(env, Error::InvalidAmount);
    }

    let escrow_data = EscrowData {
        client,
        freelancer,
        arbitrator: None,
        token: None,
        amount,
        status: EscrowStatus::Initialized,
        dispute_result: DisputeResult::None as u32,
        created_at: env.ledger().timestamp(),
        funded_at: None,
        released_at: None,
        disputed_at: None,
        resolved_at: None,
        timeout_secs: None,
        milestones: Vec::new(env),
        milestone_history: Vec::new(env),
        released_amount: 0,
        fee_manager: fee_manager, // pass this in or use a dummy Address if not available
        fee_collected: 0,
        net_amount: amount,
    };

    env.storage().instance().set(&ESCROW_DATA, &escrow_data);
    env.storage().instance().set(&INITIALIZED, &true);
}

pub fn deposit_funds(env: &Env, client: Address) {
    client.require_auth();

    if !env.storage().instance().has(&INITIALIZED) {
        handle_error(env, Error::NotInitialized);
    }

    let mut escrow_data: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();

    if escrow_data.client != client {
        handle_error(env, Error::Unauthorized);
    }

    if escrow_data.status != EscrowStatus::Initialized {
        handle_error(env, Error::InvalidStatus);
    }

    if let (Some(token), amount) = (escrow_data.token.clone(), escrow_data.amount) {
        let balance: i128 = env.invoke_contract::<i128>(
            &token,
            &Symbol::new(env, TOKEN_BALANCE),
            (client.clone(),).into_val(env),
        );
        if balance < amount {
            handle_error(env, Error::InsufficientFunds);
        }

        env.invoke_contract::<()>(
            &token,
            &Symbol::new(env, TOKEN_TRANSFER),
            (client.clone(), env.current_contract_address(), amount).into_val(env),
        );
    }

    escrow_data.status = EscrowStatus::Funded;
    escrow_data.funded_at = Some(env.ledger().timestamp());

    env.storage().instance().set(&ESCROW_DATA, &escrow_data);

    env.events().publish(
        (Symbol::new(env, "deposited_fund"), client.clone()),
        (escrow_data.amount, env.ledger().timestamp()),
    );
}

pub fn release_funds(env: &Env, freelancer: Address) {
    freelancer.require_auth();

    if !env.storage().instance().has(&INITIALIZED) {
        handle_error(env, Error::NotInitialized);
    }

    let mut escrow_data: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();

    if escrow_data.freelancer != freelancer {
        handle_error(env, Error::Unauthorized);
    }

    if escrow_data.status != EscrowStatus::Funded {
        handle_error(env, Error::InvalidStatus);
    }

    if let (Some(token), amount) = (escrow_data.token.clone(), escrow_data.amount) {
        env.invoke_contract::<()>(
            &token,
            &Symbol::new(env, TOKEN_TRANSFER),
            (env.current_contract_address(), freelancer.clone(), amount).into_val(env),
        );
    }

    // Calculate and collect fees
    // Note: In a real deployment, this would call the fee manager
    // For testing purposes, we'll simulate the fee collection
    let fee_percentage = 250; // 2.5% fee
    let fee_amount = (escrow_data.amount * fee_percentage) / 10000;
    let net_amount = escrow_data.amount - fee_amount;

    escrow_data.status = EscrowStatus::Released;
    escrow_data.released_at = Some(env.ledger().timestamp());
    escrow_data.fee_collected = fee_amount;
    escrow_data.net_amount = net_amount;

    env.storage().instance().set(&ESCROW_DATA, &escrow_data);

    env.events().publish(
        (Symbol::new(env, "released_fund"), freelancer.clone()),
        (
            escrow_data.amount,
            escrow_data.net_amount,
            escrow_data.fee_collected,
            escrow_data.client,
            env.ledger().timestamp(),
        ),
    );
}

pub fn dispute(env: &Env, caller: Address) {
    caller.require_auth();

    if !env.storage().instance().has(&INITIALIZED) {
        handle_error(env, Error::NotInitialized);
    }

    let mut escrow_data: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();

    if escrow_data.client != caller && escrow_data.freelancer != caller {
        handle_error(env, Error::Unauthorized);
    }

    if escrow_data.status != EscrowStatus::Funded {
        handle_error(env, Error::InvalidStatus);
    }

    escrow_data.status = EscrowStatus::Disputed;
    escrow_data.disputed_at = Some(env.ledger().timestamp());

    env.storage().instance().set(&ESCROW_DATA, &escrow_data);

    env.events().publish(
        (Symbol::new(env, "escrow_disputed"), caller.clone()),
        env.ledger().timestamp(),
    );
}

pub fn resolve_dispute(env: &Env, caller: Address, result: Symbol) {
    caller.require_auth();

    if !env.storage().instance().has(&INITIALIZED) {
        handle_error(env, Error::NotInitialized);
    }

    let mut escrow_data: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();

    if escrow_data.status != EscrowStatus::Disputed {
        handle_error(env, Error::DisputeNotOpen);
    }

    // Arbitrator check
    if escrow_data.arbitrator != Some(caller.clone()) {
        handle_error(env, Error::Unauthorized);
    }

    let dispute_result = if result == Symbol::new(env, "client_wins") {
        DisputeResult::ClientWins
    } else if result == Symbol::new(env, "freelancer_wins") {
        DisputeResult::FreelancerWins
    } else if result == Symbol::new(env, "split") {
        DisputeResult::Split
    } else {
        handle_error(env, Error::InvalidDisputeResult);
    };

    // Token payout
    if let (Some(token), amount) = (escrow_data.token.clone(), escrow_data.amount) {
        let contract_addr = env.current_contract_address();
        match dispute_result {
            DisputeResult::ClientWins => {
                env.invoke_contract::<()>(
                    &token,
                    &Symbol::new(env, TOKEN_TRANSFER),
                    (contract_addr.clone(), escrow_data.client.clone(), amount).into_val(env),
                );
            }
            DisputeResult::FreelancerWins => {
                env.invoke_contract::<()>(
                    &token,
                    &Symbol::new(env, TOKEN_TRANSFER),
                    (
                        contract_addr.clone(),
                        escrow_data.freelancer.clone(),
                        amount,
                    )
                        .into_val(env),
                );
            }
            DisputeResult::Split => {
                let half = amount / 2;
                env.invoke_contract::<()>(
                    &token,
                    &Symbol::new(env, TOKEN_TRANSFER),
                    (contract_addr.clone(), escrow_data.client.clone(), half).into_val(env),
                );
                env.invoke_contract::<()>(
                    &token,
                    &Symbol::new(env, TOKEN_TRANSFER),
                    (
                        contract_addr.clone(),
                        escrow_data.freelancer.clone(),
                        amount - half,
                    )
                        .into_val(env),
                );
            }
            DisputeResult::None => {
                handle_error(env, Error::InvalidDisputeResult);
            }
        }
    }

    escrow_data.status = EscrowStatus::Resolved;
    escrow_data.dispute_result = dispute_result as u32;
    escrow_data.dispute_result = match dispute_result {
        DisputeResult::ClientWins => 1,
        DisputeResult::FreelancerWins => 2,
        DisputeResult::Split => 3,
        DisputeResult::None => handle_error(env, Error::InvalidDisputeResult),
    };
    escrow_data.resolved_at = Some(env.ledger().timestamp());

    env.storage().instance().set(&ESCROW_DATA, &escrow_data);

    env.events().publish(
        (Symbol::new(env, "escrow_resolved"), result.clone()),
        env.ledger().timestamp(),
    );
}

/// @ryzen-xp
/// Add a milestone (client only)
pub fn add_milestone(env: &Env, client: Address, desc: String, amount: i128) -> u32 {
    client.require_auth();
    let mut escrow: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();

    if escrow.client != client {
        handle_error(env, Error::Unauthorized);
    }
    if amount <= 0 {
        handle_error(env, Error::InvalidAmount);
    }

    let m_id = (escrow.milestones.len() as u32) + 1;
    let ts = env.ledger().timestamp();

    let milestone = Milestone {
        id: m_id,
        description: desc.clone(),
        amount,
        approved: false,
        released: false,
        created_at: ts,
        approved_at: None,
        released_at: None,
    };

    escrow.milestones.push_back(milestone.clone());
    escrow.milestone_history.push_back(MilestoneHistory {
        milestone: milestone,
        action: String::from_str(env, "added"),
        timestamp: ts,
    });

    env.storage().instance().set(&ESCROW_DATA, &escrow);

    env.events().publish(
        (Symbol::new(env, "escrow_milestone_added"), client.clone()),
        (m_id, desc.clone(), amount, env.ledger().timestamp()),
    );
    m_id
}

/// @ryzen-xp
/// approve a milestone (client only)
pub fn approve_milestone(env: &Env, client: Address, milestone_id: u32) {
    client.require_auth();
    let mut escrow: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();
    let ts = env.ledger().timestamp();

    let mut milestone = escrow
        .milestones
        .get(milestone_id)
        .unwrap_or_else(|| handle_error(env, Error::MilestoneNotFound));

    if escrow.client != client {
        handle_error(env, Error::Unauthorized);
    }
    if milestone.approved {
        handle_error(env, Error::InvalidStatus);
    }

    milestone.approved = true;
    milestone.approved_at = Some(ts);
    escrow.milestone_history.push_back(MilestoneHistory {
        milestone: milestone.clone(),
        action: String::from_str(env, "approved"),
        timestamp: ts,
    });
    env.storage().instance().set(&ESCROW_DATA, &escrow);

    env.events().publish(
        (
            Symbol::new(env, "escrow_milestone_approved"),
            client.clone(),
        ),
        (milestone_id, env.ledger().timestamp()),
    );
}

/// @ryzen-xp
/// release a milestone (freelancer only, after approval)
pub fn release_milestone(env: &Env, freelancer: Address, milestone_id: u32) {
    freelancer.require_auth();
    let mut escrow: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();
    let ts = env.ledger().timestamp();

    let mut milestone = escrow
        .milestones
        .get(milestone_id)
        .unwrap_or_else(|| handle_error(env, Error::MilestoneNotFound));

    if !milestone.approved || milestone.released {
        handle_error(env, Error::InvalidStatus);
    }
    if escrow.freelancer != freelancer {
        handle_error(env, Error::Unauthorized);
    }

    milestone.released = true;
    milestone.released_at = Some(ts);
    escrow.released_amount += milestone.amount;
    escrow.milestone_history.push_back(MilestoneHistory {
        milestone: milestone.clone(),
        action: String::from_str(env, "released"),
        timestamp: ts,
    });
    env.storage().instance().set(&ESCROW_DATA, &escrow);

    env.events().publish(
        (
            Symbol::new(env, "escrow_milestone_released"),
            freelancer.clone(),
        ),
        (milestone_id, milestone.amount, ts),
    );
}

pub fn get_escrow_data(env: &Env) -> EscrowData {
    if !env.storage().instance().has(&INITIALIZED) {
        handle_error(env, Error::NotInitialized);
    }

    env.storage().instance().get(&ESCROW_DATA).unwrap()
}

pub fn auto_release(env: &Env) {
    if !env.storage().instance().has(&INITIALIZED) {
        handle_error(env, Error::NotInitialized);
    }
    let mut escrow_data: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();
    if escrow_data.status != EscrowStatus::Funded {
        handle_error(env, Error::InvalidStatus);
    }
    let funded_at = escrow_data.funded_at.unwrap_or(0);
    let timeout = escrow_data.timeout_secs.unwrap_or(0);
    let now = env.ledger().timestamp();
    if now < funded_at + timeout {
        handle_error(env, Error::InvalidStatus);
    }
    // Token logic
    if let (Some(token), amount) = (escrow_data.token.clone(), escrow_data.amount) {
        env.invoke_contract::<()>(
            &token,
            &Symbol::new(env, TOKEN_TRANSFER),
            (
                env.current_contract_address(),
                escrow_data.freelancer.clone(),
                amount,
            )
                .into_val(env),
        );
    }
    escrow_data.status = EscrowStatus::Released;
    escrow_data.released_at = Some(now);
    env.storage().instance().set(&ESCROW_DATA, &escrow_data);
}

/// @ryzen-xp
/// returns all milestones (status and details)
pub fn get_milestones(env: &Env) -> Vec<Milestone> {
    let escrow: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();
    escrow.milestones.clone()
}

/// @ryzen-xp
/// returns history of actions performed on milestones
pub fn get_milestone_history(env: &Env) -> Vec<MilestoneHistory> {
    let escrow: EscrowData = env.storage().instance().get(&ESCROW_DATA).unwrap();
    escrow.milestone_history.clone()
}

pub fn set_escrow_data(env: &Env, data: &EscrowData) {
    env.storage().instance().set(&ESCROW_DATA, data);
}
