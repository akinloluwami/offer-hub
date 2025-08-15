#!/bin/bash

# Rating and Reputation System Deployment Script
# This script deploys the rating contract and updates the reputation contract

set -e

echo "🚀 Starting Rating System Deployment..."

# Configuration
NETWORK=${NETWORK:-"testnet"}
ADMIN_ADDRESS=${ADMIN_ADDRESS:-""}
REPUTATION_CONTRACT_ADDRESS=${REPUTATION_CONTRACT_ADDRESS:-""}

if [ -z "$ADMIN_ADDRESS" ]; then
    echo "❌ Error: ADMIN_ADDRESS environment variable is required"
    echo "   Example: export ADMIN_ADDRESS=GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "   Network: $NETWORK"
echo "   Admin Address: $ADMIN_ADDRESS"
echo ""

# Build contracts
echo "🔨 Building contracts..."

echo "   Building rating contract..."
cd contracts-offerhub/contracts/rating-contract
cargo build --target wasm32-unknown-unknown --release --quiet

echo "   Building reputation contract..."
cd ../reputation-nft-contract
cargo build --target wasm32-unknown-unknown --release --quiet

echo "✅ Contracts built successfully!"
echo ""

# Deploy Rating Contract
echo "🚀 Deploying Rating Contract..."
cd ../rating-contract

RATING_CONTRACT_WASM="target/wasm32-unknown-unknown/release/rating_contract.wasm"

if [ ! -f "$RATING_CONTRACT_WASM" ]; then
    echo "❌ Error: Rating contract WASM file not found at $RATING_CONTRACT_WASM"
    exit 1
fi

echo "   Deploying to $NETWORK..."
RATING_CONTRACT_ID=$(soroban contract deploy \
    --network $NETWORK \
    --source-account admin \
    --wasm $RATING_CONTRACT_WASM)

echo "   Rating Contract deployed: $RATING_CONTRACT_ID"
echo ""

# Initialize Rating Contract
echo "⚙️  Initializing Rating Contract..."
soroban contract invoke \
    --network $NETWORK \
    --source-account admin \
    --id $RATING_CONTRACT_ID \
    -- init --admin $ADMIN_ADDRESS

echo "✅ Rating Contract initialized with admin: $ADMIN_ADDRESS"
echo ""

# Deploy updated Reputation Contract (if needed)
if [ -n "$REPUTATION_CONTRACT_ADDRESS" ]; then
    echo "🔄 Using existing Reputation Contract: $REPUTATION_CONTRACT_ADDRESS"
    
    # Add rating contract as minter to reputation contract
    echo "   Adding rating contract as minter to reputation contract..."
    soroban contract invoke \
        --network $NETWORK \
        --source-account admin \
        --id $REPUTATION_CONTRACT_ADDRESS \
        -- add_minter --caller $ADMIN_ADDRESS --minter $RATING_CONTRACT_ID
    
    echo "✅ Rating contract added as minter to reputation contract"
else
    echo "🚀 Deploying new Reputation Contract..."
    cd ../reputation-nft-contract
    
    REPUTATION_CONTRACT_WASM="target/wasm32-unknown-unknown/release/reputation_nft_contract.wasm"
    
    if [ ! -f "$REPUTATION_CONTRACT_WASM" ]; then
        echo "❌ Error: Reputation contract WASM file not found at $REPUTATION_CONTRACT_WASM"
        exit 1
    fi
    
    REPUTATION_CONTRACT_ID=$(soroban contract deploy \
        --network $NETWORK \
        --source-account admin \
        --wasm $REPUTATION_CONTRACT_WASM)
    
    echo "   Reputation Contract deployed: $REPUTATION_CONTRACT_ID"
    
    # Initialize Reputation Contract
    echo "⚙️  Initializing Reputation Contract..."
    soroban contract invoke \
        --network $NETWORK \
        --source-account admin \
        --id $REPUTATION_CONTRACT_ID \
        -- init --admin $ADMIN_ADDRESS
    
    echo "✅ Reputation Contract initialized"
    
    # Add rating contract as minter
    echo "   Adding rating contract as minter..."
    soroban contract invoke \
        --network $NETWORK \
        --source-account admin \
        --id $REPUTATION_CONTRACT_ID \
        -- add_minter --caller $ADMIN_ADDRESS --minter $RATING_CONTRACT_ID
    
    echo "✅ Rating contract added as minter"
    
    REPUTATION_CONTRACT_ADDRESS=$REPUTATION_CONTRACT_ID
fi

echo ""

# Configure Rating Contract with Reputation Contract
echo "🔗 Linking contracts..."
# This would set the reputation contract address in the rating contract
# (Implementation would depend on adding this function to the rating contract)

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📋 Contract Addresses:"
echo "   Rating Contract:     $RATING_CONTRACT_ID"
echo "   Reputation Contract: $REPUTATION_CONTRACT_ADDRESS"
echo ""
echo "🔧 Next Steps:"
echo "   1. Update frontend configuration with contract addresses"
echo "   2. Test rating submission functionality"
echo "   3. Verify achievement minting integration"
echo "   4. Configure moderation settings"
echo ""
echo "💡 Environment Variables for Frontend:"
echo "   export VITE_RATING_CONTRACT_ID=\"$RATING_CONTRACT_ID\""
echo "   export VITE_REPUTATION_CONTRACT_ID=\"$REPUTATION_CONTRACT_ADDRESS\""
echo ""

# Save deployment info
DEPLOYMENT_INFO="deployment-info-$(date +%Y%m%d-%H%M%S).json"
cat > $DEPLOYMENT_INFO << EOF
{
  "deployment": {
    "timestamp": "$(date -Iseconds)",
    "network": "$NETWORK",
    "admin_address": "$ADMIN_ADDRESS",
    "contracts": {
      "rating": {
        "id": "$RATING_CONTRACT_ID",
        "wasm": "$RATING_CONTRACT_WASM"
      },
      "reputation": {
        "id": "$REPUTATION_CONTRACT_ADDRESS",
        "wasm": "$REPUTATION_CONTRACT_WASM"
      }
    }
  }
}
EOF

echo "📄 Deployment info saved to: $DEPLOYMENT_INFO"
echo ""
echo "🔍 Verify deployment:"
echo "   soroban contract invoke --network $NETWORK --id $RATING_CONTRACT_ID -- get_admin"
echo "   soroban contract invoke --network $NETWORK --id $REPUTATION_CONTRACT_ADDRESS -- get_admin"
echo ""

echo "✅ Rating and Reputation System successfully deployed!"
