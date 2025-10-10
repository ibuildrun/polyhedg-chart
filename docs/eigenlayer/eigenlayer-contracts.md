================
CODE SNIPPETS
================
### Running Full Local Setup Script

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command executes a shell script that automates the entire local setup process for the slashing contracts, including deployment and configuration. It's a convenient way to quickly get the environment ready.

```Shell
./run.sh
```

--------------------------------

### Installing Development Dependencies (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This command initializes the repository for the first time by installing essential development dependencies, including the pre-commit hook, Foundry and its tools, and abigen for Go bindings.

```bash
make deps
```

--------------------------------

### Example Pull Request Description (Markdown)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This example demonstrates a complete pull request description following the specified template. It showcases how to articulate the motivation, detailed modifications, and the positive results of a code change, providing a clear model for contributors.

```markdown
feat: Implement new withdrawal flow in StrategyManager

**Motivation:**
The current withdrawal process is inefficient and leads to delays for users.

**Modifications:**
- Refactored the `withdraw` function in `StrategyManager.sol`
- Updated associated unit tests to reflect changes
- Modified documentation to explain the new withdrawal process

**Result:**
The withdrawal process is now more efficient, reducing wait times for users.
```

--------------------------------

### Installing Surya and Graphviz (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

These commands install Surya globally via npm for Solidity contract analysis and Graphviz via apt for generating graphical representations. Both are prerequisites for generating inheritance and control-flow graphs.

```bash
npm i -g surya

apt install graphviz
```

--------------------------------

### Starting Anvil Local Blockchain

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This snippet starts a local Anvil blockchain instance, which is a development blockchain used for testing smart contracts. It provides a local RPC endpoint for interacting with the blockchain.

```Shell
anvil
```

--------------------------------

### Setting Up Fork Test Environment (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This command sources an environment script to configure the local environment for running fork tests against the Ethereum mainnet. It requires the 'RPC_MAINNET' environment variable to be set and 'yq' to be installed.

```bash
source bin/source-env.sh [local]
```

--------------------------------

### Running Solhint Static Analysis (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This command runs Solhint, a linter for Solidity, across all contract files in the 'src/contracts' directory. It helps enforce coding style and identify potential issues in Solidity code. Solhint must be installed separately.

```bash
solhint 'src/contracts/**/*.sol'
```

--------------------------------

### Running Unit and Integration Tests (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This command executes the full suite of unit and integration tests for the project. It's used to verify the development setup and ensure that all code changes maintain existing functionality and do not introduce regressions.

```bash
forge test
```

--------------------------------

### Running Slither Static Analysis (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This command executes Slither, a Solidity static analysis framework, on the entire project. Slither is used to detect security vulnerabilities and provide insights into contract behavior. Slither must be installed separately.

```bash
slither .
```

--------------------------------

### Building Project with Foundry (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

These commands update Foundry to its latest version and then compile the project's smart contracts. This is a crucial step to ensure all contract changes are reflected and ready for testing or deployment.

```bash
foundryup

forge build
```

--------------------------------

### Pull Request Description Template (Markdown)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This template provides a structured format for pull request descriptions, guiding contributors to include sections for motivation, specific modifications made, and the resulting outcome of the changes. It ensures comprehensive and consistent PR documentation.

```markdown
**Motivation:**
- Describe the context and reason for the change

**Modifications:**
- Detail the specific changes made

**Result:**
- Explain the outcome or effects of the change
```

--------------------------------

### Generating Go Bindings (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This command generates Go language bindings for the smart contracts. These bindings allow Go applications to interact with the deployed contracts, facilitating integration with Go-based services.

```bash
make bindings
```

--------------------------------

### Building Forge Task Scripts

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command compiles the Solidity task scripts located in `script/tasks` using Forge. This step is necessary to ensure all subsequent task-related scripts are ready for execution.

```Shell
forge build -C script/tasks
```

--------------------------------

### Exporting Withdrawal Start Block Number - Shell

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command captures the current blockchain block number and exports it as an environment variable, `WITHDRAWAL_START_BLOCK_NUMBER`. This variable is essential for subsequent steps in the withdrawal process, particularly for calculating the minimum withdrawal delay. It relies on the `cast` CLI tool and an RPC URL.

```sh
export WITHDRAWAL_START_BLOCK_NUMBER=$(cast block-number --rpc-url $RPC_URL)
```

--------------------------------

### Deploying Slashing Contracts with Forge Script

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This script deploys the slashing-magnitudes contracts to the local Anvil instance using Forge. It sets environment variables for the RPC URL and private key, then executes a Solidity script to deploy contracts and save their addresses to a JSON file.

```Shell
export RPC_URL=127.0.0.1:8545
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export SENDER=$(cast wallet address --private-key $PRIVATE_KEY)

mkdir ./script/output/local
forge script -C src/contracts --via-ir ../deploy/local/deploy_from_scratch.slashing.s.sol \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile)" \
    -- local/deploy_from_scratch.slashing.anvil.config.json
```

--------------------------------

### Allocating OperatorSet with Forge Script

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This Forge script allocates a specific `OperatorSet` with a given magnitude. This step is part of the slashing setup, defining how much of the operator's stake is subject to potential slashing within that set.

```Shell
forge script ../tasks/allocate_operatorSet.s.sol \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile,address strategy,address avs,uint32 operatorSetId,uint64 magnitude)" \
    -- local/slashing_output.json $STRATEGY $SENDER 00000001 0500000000000000000
```

--------------------------------

### Depositing Tokens into Strategy Contract

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This Forge script call deposits a specified amount of tokens into the `Strategy` contract. This action simulates a staker depositing funds, which are then managed by the strategy.

```Shell
forge script ../tasks/deposit_into_strategy.s.sol \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile,address strategy,address token,uint256 amount)" \
    -- local/slashing_output.json $STRATEGY $TOKEN 1000
```

--------------------------------

### Running Fork Tests (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This command executes the test suite in a forked environment, allowing tests to interact with a simulated mainnet state. It requires a specified RPC URL to connect to the forked blockchain.

```bash
forge test --fork-url [RPC_URL]
```

--------------------------------

### Advancing Anvil Blockchain by 600 Blocks

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command advances the local Anvil blockchain by 600 blocks. This is often required to simulate the passage of time or to move beyond a `pendingDelay` period before certain on-chain actions can be performed.

```Shell
cast rpc anvil_mine 600 --rpc-url $RPC_URL
```

--------------------------------

### Completing Withdrawal from Strategy - Forge Script

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command executes a Solidity script via `forge script` to finalize a withdrawal from a specified strategy. It broadcasts the transaction to the network, passing critical parameters such as the RPC URL, private key, configuration file, strategy address, token address, amount of shares, nonce, and the previously recorded start block number. This step is the core of the withdrawal completion.

```sh
forge script ../tasks/complete_withdrawal_from_strategy.s.sol \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile,address strategy,address token,uint256 amount,uint256 nonce,uint32 startBlock)" \
    -- local/slashing_output.json $STRATEGY $TOKEN $SHARES $NONCE $WITHDRAWAL_START_BLOCK_NUMBER
```

--------------------------------

### Extracting Contract Addresses from Deployment Output

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This snippet uses `jq` to parse the `slashing_output.json` file and extract critical contract addresses (DelegationManager, StrategyManager, Strategy, TestToken). These addresses are then set as environment variables for subsequent operations.

```Shell
export DELEGATION_MANAGER=$(jq -r '.addresses.delegationManager' "../output/local/slashing_output.json")
export STRATEGY_MANAGER=$(jq -r '.addresses.strategyManager' "../output/local/slashing_output.json")
export STRATEGY=$(jq -r '.addresses.strategy' "../output/local/slashing_output.json")
export TOKEN=$(jq -r '.addresses.TestToken' "../output/local/slashing_output.json")
```

--------------------------------

### Verifying Deposited TOKEN Shares

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This `cast call` command queries the `STRATEGY_MANAGER` to verify that the sender holds the expected amount of deposited `TOKEN` shares. It confirms the initial deposit was successful.

```Shell
cast call $STRATEGY_MANAGER "getDeposits(address)(address[],uint256[])" $SENDER  --rpc-url $RPC_URL
```

--------------------------------

### Advancing Blockchain by 5 Blocks - Shell

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command advances the blockchain by 5 blocks using the `anvil_mine` RPC method. This action is crucial to satisfy the `MIN_WITHDRAWAL_DELAY_BLOCKS` requirement, ensuring that sufficient time has passed for a withdrawal to become eligible for completion. It requires `cast` and an RPC URL connected to an Anvil instance.

```sh
cast rpc anvil_mine 5 --rpc-url $RPC_URL
```

--------------------------------

### Registering as an Operator with Forge Script

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command registers the sender's address as an `Operator` within the EigenLayer system. It requires a `metadataURI` for the operator's information and is a crucial step before an operator can participate in an `OperatorSet`.

```Shell
forge script ../tasks/register_as_operator.s.sol \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile,address operator,string metadataURI)" \
    -- local/slashing_output.json $SENDER "metadataURI"
```

--------------------------------

### Slashing OperatorSet with Forge Script

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command executes a Forge script to perform a slashing operation on a specified `OperatorSet`. It simulates a scenario where an operator's stake is reduced due to a detected misbehavior, demonstrating the slashing mechanism.

```Shell
forge script ../tasks/slash_operatorSet.s.sol \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile,address operator,uint32 operatorSetId,uint256 wadToSlash)" \
    -- local/slashing_output.json $SENDER 00000001 0500000000000000000
```

--------------------------------

### Generating Inheritance and Control-Flow Graphs with Surya (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

These commands use Surya to generate an inheritance graph of Solidity contracts, outputting it as a PNG image, and also create a detailed markdown report. This helps visualize contract relationships and structure.

```bash
surya inheritance ./src/contracts/**/*.sol | dot -Tpng > InheritanceGraph.png

surya mdreport surya_report.md ./src/contracts/**/*.sol
```

--------------------------------

### Queueing Withdrawal from Strategy

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This Forge script queues a withdrawal of tokens from the `Strategy` contract. It uses the previously extracted `DEPOSITS` amount to specify how many shares to withdraw, initiating the process to retrieve funds after slashing.

```Shell
forge script ../tasks/withdraw_from_strategy.s.sol \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile,address strategy,address token,uint256 amount)" \
    -- local/slashing_output.json $STRATEGY $TOKEN $DEPOSITS
```

--------------------------------

### Registering Operator to OperatorSet

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This Forge script registers the previously registered operator to an `OperatorSet`. This association is necessary for the operator to be included in a group that can be allocated and potentially slashed.

```Shell
forge script ../tasks/register_operator_to_operatorSet.s.sol \
    --tc RegisterOperatorToOperatorSets \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile)" \
    -- local/slashing_output.json
```

--------------------------------

### Starting a Checkpoint in EigenPod (Solidity)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/docs/core/EigenPod.md

This Solidity function, `startCheckpoint`, allows an `EigenPod` owner or a designated proof submitter to initiate a checkpoint. It takes a snapshot of the pod's native ETH balance, the count of active validators, and the beacon block root, which are critical for subsequent proof submissions and share updates. The `revertIfNoBalance` parameter controls whether the function should revert if the pod's native ETH balance is zero, preventing unintentional checkpoints.

```Solidity
function startCheckpoint(bool revertIfNoBalance)
    external
    onlyOwnerOrProofSubmitter() 
    onlyWhenNotPaused(PAUSED_START_CHECKPOINT)
```

--------------------------------

### Updating Storage Report (Bash)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This command updates the storage reports located in the '/docs/storage-report' directory. These reports provide insights into contract storage layouts and gas usage, which are important for optimization and auditing.

```bash
make storage-report
```

--------------------------------

### Unpausing AVS Directory with Forge Script

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command executes a Forge script to unpause the `avsDirectory` contract. Unpausing is a prerequisite for certain operations, allowing the AVS (Actively Validated Service) to function correctly.

```Shell
forge script ../tasks/unpause_avsDirectory.s.sol \
    --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
    --sig "run(string memory configFile)" \
    -- local/slashing_output.json
```

--------------------------------

### Verifying Withdrawable TOKEN Shares After Slashing

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This `cast call` command queries the `DELEGATION_MANAGER` to verify the amount of `TOKEN` shares that are currently withdrawable by the sender. This step is crucial to confirm the effect of the slashing operation, expecting a reduced amount.

```Shell
cast call $DELEGATION_MANAGER "getWithdrawableShares(address,address[])(uint256[])" $SENDER "[$STRATEGY]" --rpc-url $RPC_URL
```

--------------------------------

### Extracting Withdrawal Information from DelegationManager

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This snippet extracts necessary information for a withdrawal, including deposited shares, withdrawable shares, and the cumulative withdrawal nonce, by calling functions on the `DELEGATION_MANAGER` contract. This data is then used to queue the actual withdrawal.

```Shell
export DEPOSITS=$(cast call $DELEGATION_MANAGER "getDepositedShares(address)(address[],uint256[])" $SENDER "[$STRATEGY]" --rpc-url $RPC_URL | sed -n '2p' | tr -d '[]')
export SHARES=$(cast call $DELEGATION_MANAGER "getWithdrawableShares(address,address[])(uint256[],uint256[])" $SENDER "[$STRATEGY]" --rpc-url $RPC_URL | sed -n '1p' | tr -d '[]')
export NONCE=$(cast call $DELEGATION_MANAGER "cumulativeWithdrawalsQueued(address)(uint256)" $SENDER --rpc-url $RPC_URL)
```

--------------------------------

### Verifying Token Balance of Sender - Shell

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command uses `cast call` to query the `balanceOf` function of the specified token contract for the sender's address. The purpose is to verify that the withdrawn shares have been successfully returned to the sender's token balance, confirming the completion of the transfer. It depends on `cast`, the token address, sender address, and RPC URL.

```sh
cast call $TOKEN "balanceOf(address)(uint256)" $SENDER --rpc-url $RPC_URL
```

--------------------------------

### Using Foundry Cheatcodes for Time Travel Testing in Solidity

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/src/test/integration/README.md

This snippet illustrates the use of Foundry's `cheats.snapshotState()` and `cheats.revertToState()` via the `TimeMachine` concept for efficient integration testing. It shows how state is snapshotted before actions (`depositIntoEigenlayer`, `delegateTo`) and then assertions (`assert_Snap_AddedStakerShares`, `assert_Snap_AddedOperatorShares`) are made by comparing current state to the snapshotted state, simplifying test setup and verification.

```Solidity
function testFuzz_deposit_delegate_EXAMPLE(uint24 _random) public {   
    // ... test setup goes above here
    
    // This snapshots state before the deposit.
    staker.depositIntoEigenlayer(strategies, tokenBalances);
    // This checks the staker's shares from before `depositIntoEigenlayer`, and compares
    // them to their shares after `depositIntoEigenlayer`.
    assert_Snap_AddedStakerShares(staker, strategies, expectedShares, "failed to award staker shares");

    // This snapshots state before delegating.
    staker.delegateTo(operator);
    // This checks the operator's `operatorShares` before the staker delegated to them, and
    // compares those shares to the `operatorShares` after the staker delegated.
    assert_Snap_AddedOperatorShares(operator, strategies, expectedShares, "failed to award operator shares");
}
```

--------------------------------

### Verifying Zero Withdrawable Shares - Shell

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/tasks/README.md

This command calls the `getWithdrawableShares` function on the `DELEGATION_MANAGER` contract for the sender and a list of strategies. It serves to confirm that the sender no longer holds any withdrawable shares for the specified strategy, indicating that the withdrawal process has been fully completed and cleared from the system. It requires `cast`, the delegation manager address, sender address, strategy address, and RPC URL.

```sh
cast call $DELEGATION_MANAGER "getWithdrawableShares(address,address[])(uint256[])" $SENDER "[$STRATEGY]" --rpc-url $RPC_URL
```

--------------------------------

### Updating Proof Submitter Address - EigenPod - Solidity

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/docs/core/EigenPod.md

Allows the Pod Owner to update the Proof Submitter address for the `EigenPod`. This secondary address can perform validator and proof-related tasks, enabling a hot wallet setup without exposing full owner permissions. The Pod Owner can also remove the Proof Submitter by setting `newProofSubmitter` to `0x0`.

```Solidity
function setProofSubmitter(address newProofSubmitter) external onlyEigenPodOwner
```

--------------------------------

### Formatting Pull Request Title (Markdown)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/CONTRIBUTING.md

This snippet illustrates the required format for pull request titles, which should consist of a 'type' (e.g., feat, fix, docs) followed by a brief 'subject' describing the change. This standardization aids in clear commit history and automated release notes.

```markdown
<type>: <subject>
```

--------------------------------

### Tracking Deposit Shares and Slashing Factor in EigenPodManager (Solidity)

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/docs/core/EigenPodManager.md

This snippet defines the core state variables used by the `EigenPodManager` to track staker deposit shares and their beacon chain slashing factor. `podOwnerDepositShares` maps pod owners to their shares, which are increased on balance increases but not decreased on balance decreases (instead, slashing factor is adjusted). `_beaconChainSlashingFactor` is a struct and mapping that tracks the proportion of balance decreased due to slashing, starting at 1 WAD and monotonically decreasing. These variables are crucial for managing staker balances and withdrawals, especially in the context of slashing.

```Solidity
/**
 * @notice mapping from pod owner to the deposit shares they have in the virtual beacon chain ETH strategy
 *
 * @dev When an EigenPod registers a balance increase, deposit shares are increased. When registering a balance
 * decrease, however, deposit shares are NOT decreased. Instead, the pod owner's beacon chain slashing factor
 * is decreased proportional to the balance decrease. This impacts the number of shares that will be withdrawn
 * when the deposit shares are queued for withdrawal in the DelegationManager.
 *
 * Note that prior to the slashing release, deposit shares were decreased when balance decreases occurred. 
 * In certain cases, a combination of queueing a withdrawal plus registering a balance decrease could result
 * in a staker having negative deposit shares in this mapping. This negative value would be corrected when the
 * staker completes a withdrawal (as tokens or as shares).
 *
 * With the slashing release, negative shares are no longer possible. However, a staker can still have negative
 * shares if they met the conditions for them before the slashing release. If this is the case, that staker
 * should complete any outstanding queued withdrawal in the DelegationManager ("as shares"). This will correct
 * the negative share count and allow the staker to continue using their pod as normal.
 */
mapping(address podOwner => int256 shares) public podOwnerDepositShares;

/**
 * @notice The amount of beacon chain slashing experienced by a pod owner as a proportion of WAD
 * @param isSet whether the slashingFactor has ever been updated. Used to distinguish between
 * a value of "0" and an uninitialized value.
 * @param slashingFactor the proportion of the pod owner's balance that has been decreased due to
 * slashing or other beacon chain balance decreases.
 * @dev NOTE: if !isSet, `slashingFactor` should be treated as WAD. `slashingFactor` is monotonically
 * decreasing and can hit 0 if fully slashed.
 */
struct BeaconChainSlashingFactor {
    bool isSet;
    uint64 slashingFactor;
}

/// @notice Returns the slashing factor applied to the `staker` for the `beaconChainETHStrategy`
/// Note: this value starts at 1 WAD (1e18) for all stakers, and is updated when a staker's pod registers
/// a balance decrease.
mapping(address staker => BeaconChainSlashingFactor) internal _beaconChainSlashingFactor;
```

--------------------------------

### Creating Operator-Directed AVS Rewards Submission in Solidity

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/docs/core/RewardsCoordinator.md

This Solidity function allows an AVS to submit operator-directed rewards. It facilitates flexible reward distribution strategies based on operator performance or custom economic models. The function transfers specified token amounts from the caller to the `RewardsCoordinator`, generates a unique rewards hash, increments a submission nonce, and emits an `OperatorDirectedAVSRewardsSubmissionCreated` event. It requires the contract not to be paused, the caller to be authorized, and adheres to strict validation rules for reward parameters like duration, start timestamp, strategy whitelisting, and operator reward amounts.

```Solidity
function createOperatorDirectedAVSRewardsSubmission(
    address avs,
    OperatorDirectedRewardsSubmission[] calldata operatorDirectedRewardsSubmissions
)
    external
    onlyWhenNotPaused(PAUSED_OPERATOR_DIRECTED_AVS_REWARDS_SUBMISSION)
    checkCanCall(avs)
    nonReentrant
```

--------------------------------

### Viewing Zeus Environment Configuration

Source: https://github.com/layr-labs/eigenlayer-contracts/blob/main/script/releases/README.md

This command allows users to inspect the configuration details for a specific Zeus environment, such as 'preprod', displaying parameters and deployment addresses.

```Shell
zeus env show preprod
```