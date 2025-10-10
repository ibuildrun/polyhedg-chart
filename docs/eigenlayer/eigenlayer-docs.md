================
CODE SNIPPETS
================
### Deploying HelloWorld Contracts - Solidity

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/developers/HowTo/get-started/quickstart.md

This Solidity snippet demonstrates how to deploy the HelloWorld contracts, associating quorums and their asset strategies with the AVS. It initializes an ERC20 mock token and deploys a new strategy using the StrategyFactory, then pushes it to the quorum's strategies with a specified multiplier.

```Solidity
token = new ERC20Mock();
helloWorldStrategy = IStrategy(StrategyFactory(coreDeployment.strategyFactory).deployNewStrategy(token));

quorum.strategies.push(
    StrategyParams({strategy: helloWorldStrategy, multiplier: 10_000})
);
```

--------------------------------

### Declaring HelloWorldServiceManager Contract in Solidity

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/developers/HowTo/get-started/quickstart.md

This snippet defines the `HelloWorldServiceManager` contract, inheriting from `ECDSAServiceManagerBase` and `IHelloWorldServiceManager`. It also imports the `ECDSAUpgradeable` library for `bytes32` operations, establishing the contract's foundational structure and dependencies within the EigenLayer middleware.

```Solidity
contract HelloWorldServiceManager is ECDSAServiceManagerBase, IHelloWorldServiceManager {
    using ECDSAUpgradeable for bytes32;
```

--------------------------------

### Signing and Responding to Tasks - TypeScript

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/developers/HowTo/get-started/quickstart.md

This TypeScript function generates a 'Hello, Name' message, hashes it, and signs it using the operator's wallet. It then encodes the operator's signature and address, along with the current block number, into a format suitable for on-chain submission. Finally, it calls `helloWorldServiceManager.respondToTask` to submit the signed response to the AVS.

```TypeScript
// Generate Hello, Name message string
const signAndRespondToTask = async (taskIndex: number, taskCreatedBlock: number, taskName: string) => {
    const message = `Hello, ${taskName}`;
    const messageHash = ethers.solidityPackedKeccak256(["string"], [message]);
    const messageBytes = ethers.getBytes(messageHash);
    const signature = await wallet.signMessage(messageBytes);

    console.log(`Signing and responding to task ${taskIndex}`);

    const operators = [await wallet.getAddress()];
    const signatures = [signature];
    const signedTask = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "bytes[]", "uint32"],
        [operators, signatures, ethers.toBigInt(await provider.getBlockNumber()-1)]
    );

    const tx = await helloWorldServiceManager.respondToTask(
        { name: taskName, taskCreatedBlock: taskCreatedBlock },
        taskIndex,
        signedTask
    );
    await tx.wait();
    console.log(`Responded to task.`);
};
```

--------------------------------

### Managing AVS Task Lifecycle in Solidity

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/developers/HowTo/get-started/quickstart.md

These functions implement the core business logic for the Hello World AVS. `createNewTask` creates a new task, stores its hash, emits an event, and increments the task counter. `respondToTask` allows operators to submit a signed response, validating the task, ensuring a unique response, and verifying the signature against the `ECDSAStakeRegistry` before storing the response and emitting an event.

```Solidity
function createNewTask(
    string memory name
) external returns (Task memory) {
    // create a new task struct
    Task memory newTask;
    newTask.name = name;
    newTask.taskCreatedBlock = uint32(block.number);

    // store hash of task on-chain, emit event, and increase taskNum
    allTaskHashes[latestTaskNum] = keccak256(abi.encode(newTask));
    emit NewTaskCreated(latestTaskNum, newTask);
    latestTaskNum = latestTaskNum + 1;

    return newTask;
}

function respondToTask(
    Task calldata task,
    uint32 referenceTaskIndex,
    bytes memory signature
) external {
    // check that the task is valid, hasn't been responded to yet, and is being responded in time
    require(
        keccak256(abi.encode(task)) == allTaskHashes[referenceTaskIndex],
        "supplied task does not match the one recorded in the contract"
    );
    require(
        allTaskResponses[msg.sender][referenceTaskIndex].length == 0,
        "Operator has already responded to the task"
    );

    // The message that was signed
    bytes32 messageHash = keccak256(abi.encodePacked("Hello, ", task.name));
    bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
    bytes4 magicValue = IERC1271Upgradeable.isValidSignature.selector;
    if (!(magicValue == ECDSAStakeRegistry(stakeRegistry).isValidSignature(ethSignedMessageHash,signature))){
        revert();
    }

    // updating the storage with task responses
    allTaskResponses[msg.sender][referenceTaskIndex] = signature;

    // emitting event
    emit TaskResponded(referenceTaskIndex, task, msg.sender);
}
```

--------------------------------

### Installing EigenLayer CLI using Binary

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

This command downloads and executes the installation script for the latest EigenLayer CLI binary. The binary will be installed in the `~/bin` directory, providing a direct way to get the CLI tool.

```Bash
curl -sSfL https://raw.githubusercontent.com/layr-labs/eigenlayer-cli/master/scripts/install.sh | sh -s
```

--------------------------------

### Monitoring New Tasks - TypeScript

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/developers/HowTo/get-started/quickstart.md

This TypeScript function sets up an event listener to monitor for 'NewTaskCreated' events emitted by the `helloWorldServiceManager`. Upon detecting a new task, it logs the task details and then calls `signAndRespondToTask` to process and respond to it, enabling real-time task handling.

```TypeScript
// Listen for new task events on-chain
const monitorNewTasks = async () => {

    helloWorldServiceManager.on("NewTaskCreated", async (taskIndex: number, task: any) => {
        console.log(`New task detected: Hello, ${task.name}`);
        await signAndRespondToTask(taskIndex, task.taskCreatedBlock, task.name);
    });
    console.log("Monitoring for new tasks...");
};
```

--------------------------------

### Building EigenLayer CLI from Source (Go/Shell)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This sequence of commands clones the EigenLayer CLI source code, navigates into the directory, creates a build folder, and then compiles the `eigenlayer` executable using `go build`. This method requires Go to be installed.

```Shell
git clone https://github.com/Layr-Labs/eigenlayer-cli.git
cd eigenlayer-cli
mkdir -p build
go build -o build/eigenlayer cmd/eigenlayer/main.go
```

--------------------------------

### Example Delegation Approval Signature Output

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This output demonstrates the structure of a generated delegation approval signature, including the operator's address, the signature itself, its expiry timestamp, and the unique approver salt. These details are provided to stakers to enable successful delegation.

```text
operator: 0x2222AAC0C980Cc029624b7ff55B88Bc6F63C538f
approverSignatureAndExpiry.signature: 0xd8af4e2d294d644a989a517583420037d9a089de23bb828b3c00e309e5c6517b236221a5af145cea9eeba59f24732bb410efa79bc840130724b2bf23640011271c
approverSignatureAndExpiry.expiry: 1729989609
approverSalt: 0xdca4f1809aeb9c0f7059e328d1e28b317efff44b4ae9c2de67a53af8865876d3
```

--------------------------------

### Installing Project Dependencies (Yarn)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/README.md

This command installs all necessary project dependencies using Yarn. It is the first step required to set up the development environment.

```Shell
yarn
```

--------------------------------

### Creating New Tasks for AVS - TypeScript

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/developers/HowTo/get-started/quickstart.md

This TypeScript asynchronous function, referred to as the 'AVS Consumer', creates a new task by calling `helloWorldServiceManager.createNewTask` with a specified task name. It then waits for the transaction to be mined and logs the transaction hash, handling potential errors during the process.

```TypeScript
// Create a New Task (a new name to be signed as "hello, name")
async function createNewTask(taskName: string) {
  try {
    // Send a transaction to the createNewTask function
    const tx = await helloWorldServiceManager.createNewTask(taskName);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Transaction successful with hash: ${receipt.hash}`);
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}
```

--------------------------------

### Installing EigenLayer CLI via Go (Go)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This command uses the Go toolchain to install the EigenLayer CLI executable along with its required libraries and dependencies. It fetches the latest version of the `eigenlayer` command from its GitHub repository.

```Go
go install github.com/Layr-Labs/eigenlayer-cli/cmd/eigenlayer@latest
```

--------------------------------

### Installing EigenLayer CLI via Binary

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This command downloads and executes the installation script for the latest EigenLayer CLI binary. It fetches the script from the official GitHub repository and pipes it to `sh` for execution, installing the binary into the `~/bin` directory.

```Bash
curl -sSfL https://raw.githubusercontent.com/layr-labs/eigenlayer-cli/master/scripts/install.sh | sh -s
```

--------------------------------

### Installing EigenLayer CLI via Binary (Shell)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This command downloads and executes an installation script from the EigenLayer GitHub repository to install the latest CLI binary. The binary will be placed in the `~/bin` directory by default.

```Shell
curl -sSfL https://raw.githubusercontent.com/layr-labs/eigenlayer-cli/master/scripts/install.sh | sh -s
```

--------------------------------

### Example Unsigned Delegation Approval Salt Output

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This output displays the components required to manually sign a delegation approval, including the staker, operator, delegation approver addresses, the approver salt, expiry, and the hash to be signed. This allows for off-chain signing of the delegation approval.

```text
staker: 0x5f8C207382426D3f7F248E6321Cf93B34e66d6b9
operator: 0x2222AAC0C980Cc029624b7ff55B88Bc6F63C538f
_delegationApprover: 0x111116fE4F8C2f83E3eB2318F090557b7CD0BF76
approverSalt: 0x5a94beaf38876a825bc1a12ba0c1e290e28934b9f9748a754cf76e3d10ecef23
expiry: 1729990089

hash: 0x48d6bfbd7ebc9c106c060904b0c9066951349858f1390d566d5cd726600dd1e8 (sign this payload)
```

--------------------------------

### Installing EigenLayer CLI using Go

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

This Go command installs the EigenLayer CLI executable along with its library and dependencies. It requires Go version 1.21 or higher to be installed on the system and places the executable in the GOBIN directory.

```Go
go install github.com/Layr-Labs/eigenlayer-cli/cmd/eigenlayer@latest
```

--------------------------------

### Installing EigenLayer CLI from Source using Go

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

This snippet outlines the steps to manually compile and install the EigenLayer CLI from its source code using Go. It involves cloning the repository, creating a build directory, and then compiling the main Go file to produce the `eigenlayer` executable.

```Shell
git clone https://github.com/Layr-Labs/eigenlayer-cli.git
cd eigenlayer-cli
mkdir -p build
go build -o build/eigenlayer cmd/eigenlayer/main.go
```

--------------------------------

### Example: Importing Specific ECDSA Key with EigenLayer CLI

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This command demonstrates importing a specific ECDSA private key with a given hex value, naming it 'test'. It prompts for a password to encrypt the key before saving it to the local file system, making it available for operator registration.

```Shell
eigenlayer operator keys import --key-type ecdsa test 6842fb8f5fa574d0482818b8a825a15c4d68f542693197f2c2497e3562f335f6
```

--------------------------------

### Installing EigenLayer CLI via Go

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This Go command installs the EigenLayer CLI executable and its dependencies directly from the GitHub repository. It fetches the latest version of the `eigenlayer` command-line tool, making it available in your Go binary path (GOBIN).

```Go
go install github.com/Layr-Labs/eigenlayer-cli/cmd/eigenlayer@latest
```

--------------------------------

### Building EigenLayer CLI from Source with Make (Shell)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This method compiles the EigenLayer CLI from source using a `Makefile`. It first clones the repository and then executes `make build` to generate the executable, simplifying the build process for users with `make` installed.

```Shell
git clone https://github.com/Layr-Labs/eigenlayer-cli.git
cd eigenlayer-cli
make build
```

--------------------------------

### Installing EigenLayer CLI from Source using Make

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This snippet provides an alternative method to compile and install the EigenLayer CLI from source, leveraging the `make` utility. It involves cloning the repository and running `make build` to generate the executable. This method requires `make` to be installed on the system.

```Shell
git clone https://github.com/Layr-Labs/eigenlayer-cli.git
cd eigenlayer-cli
make build
```

--------------------------------

### Installing EigenLayer CLI Binary to Custom Location

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This command downloads and executes the EigenLayer CLI installation script, allowing the user to specify a custom installation directory using the `-b` flag. Replace `<custom_location>` with the desired path where the binary should be installed.

```Bash
curl -sSfL https://raw.githubusercontent.com/layr-labs/eigenlayer-cli/master/scripts/install.sh | sh -s -- -b <custom_location>
```

--------------------------------

### Starting Local Development Server (Yarn)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/README.md

This command initiates a local development server and automatically opens the website in a browser. It supports live reloading, reflecting most changes without a server restart.

```Shell
yarn start
```

--------------------------------

### Installing EigenLayer CLI to Custom Location (Shell)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This command installs the EigenLayer CLI binary to a specified custom location. The `-b` flag followed by `<custom_location>` directs the installation script to place the binary in the desired directory.

```Shell
curl -sSfL https://raw.githubusercontent.com/layr-labs/eigenlayer-cli/master/scripts/install.sh | sh -s -- -b <custom_location>
```

--------------------------------

### Adding Go Binary Path to System PATH (Shell)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

These commands set the `GOBIN` environment variable to the Go binary directory and then prepend `GOBIN` to the system's `PATH`. This ensures that Go-installed executables, like `eigenlayer`, are discoverable and executable from any terminal location.

```Shell
export GOBIN=$GOPATH/bin
export PATH=$GOBIN:$PATH
```

--------------------------------

### Installing EigenLayer CLI Binary in Custom Location

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

This command downloads and executes the installation script for the EigenLayer CLI binary, allowing the user to specify a custom installation directory using the `-b` flag. This provides flexibility for users who prefer not to install in the default `~/bin` location.

```Bash
curl -sSfL https://raw.githubusercontent.com/layr-labs/eigenlayer-cli/master/scripts/install.sh | sh -s -- -b <custom_location>
```

--------------------------------

### Installing EigenLayer CLI from Source using Go

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This snippet outlines the steps to manually compile and install the EigenLayer CLI from its source code. It involves cloning the repository, creating a build directory, and using `go build` to generate the executable. A Go version of 1.21 or higher is required.

```Shell
git clone https://github.com/Layr-Labs/eigenlayer-cli.git
cd eigenlayer-cli
mkdir -p build
go build -o build/eigenlayer cmd/eigenlayer/main.go
```

--------------------------------

### Installing EigenLayer CLI from Source using Make

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

This snippet provides an alternative method for installing the EigenLayer CLI from source, leveraging the `make` utility. It simplifies the build process by executing a predefined `build` target within the cloned repository.

```Shell
git clone https://github.com/Layr-Labs/eigenlayer-cli.git
cd eigenlayer-cli
make build
```

--------------------------------

### Adding EigenLayer CLI to PATH (Shell)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This command adds the `~/bin` directory, where the EigenLayer CLI binary is installed, to the system's `PATH` environment variable. This allows the `eigenlayer` command to be executed from any directory in the terminal.

```Shell
export PATH=$PATH:~/bin
```

--------------------------------

### Example S3 URL for Rewards Snapshot Data

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

Provides an example URL for accessing the `claim-amounts.json` file for a specific snapshot date (2024-08-11) on the Mainnet Ethereum environment. This URL demonstrates the constructed path using the bucket URL, environment, network, and snapshot date.

```URL
https://eigenlabs-rewards-mainnet-ethereum.s3.amazonaws.com/mainnet/ethereum/2024-08-11/claim-amounts.json
```

--------------------------------

### Registering Operator to EigenLayer and AVS - TypeScript

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/developers/HowTo/get-started/quickstart.md

This TypeScript function registers an operator with both the core EigenLayer contracts and the Hello World AVS. It first calls `delegationManager.registerAsOperator` for EigenLayer, then `ecdsaRegistryContract.registerOperatorWithSignature` for the AVS, ensuring the operator is fully registered to participate.

```TypeScript
// Register Operator to EigenLayer core contracts and Hello World AVS
const registerOperator = async () => {
    
    // Registers as an Operator in EigenLayer.
    try {
        const tx1 = await delegationManager.registerAsOperator({
            __deprecated_earningsReceiver: await wallet.address,
            delegationApprover: "0x0000000000000000000000000000000000000000",
            stakerOptOutWindowBlocks: 0
        }, "");
        await tx1.wait();
        console.log("Operator registered to Core EigenLayer contracts");
    }
    
    ...
    
    
    const tx2 = await ecdsaRegistryContract.registerOperatorWithSignature(
        operatorSignatureWithSaltAndExpiry,
        wallet.address
    );
    await tx2.wait();
    console.log("Operator registered on AVS successfully");
};
```

--------------------------------

### Adding Go Binary Path to System PATH

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

These commands set the GOBIN environment variable to the Go binary directory and then prepend it to the system's PATH. This ensures that Go executables, including the EigenLayer CLI, can be run from any directory in the terminal after installation.

```Bash
export GOBIN=$GOPATH/bin
export PATH=$GOBIN:$PATH
```

--------------------------------

### Example Input for Creating an ECDSA Key (EigenLayer CLI)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

This is an example of the command used to create an ECDSA key named 'test'. When executed, the CLI will prompt for a password to encrypt the private key, ensuring its security.

```Shell
eigenlayer operator keys create --key-type ecdsa test
```

--------------------------------

### Creating Operator Configuration Files (EigenLayer CLI)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This command initiates the creation of `operator.yaml` and `metadata.json` files, essential for EigenLayer operator registration. Users must ensure the operator address matches their ECDSA key address.

```CLI
eigenlayer operator config create
```

--------------------------------

### Example: Creating an ECDSA Key with CLI

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This specific example demonstrates how to create an ECDSA key named 'test' using the `eigenlayer` CLI. Upon execution, the tool will prompt the user to enter a password to encrypt the private key, which is hidden for security.

```Shell
eigenlayer operator keys create --key-type ecdsa test
```

--------------------------------

### Checking Docker Installation (Shell)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This command checks if Docker is installed and running on the system. If Docker is active, EigenLayer can be utilized within a Docker container, providing a suitable Linux environment.

```Shell
docker --version
```

--------------------------------

### Example Input for Importing an ECDSA Key (EigenLayer CLI)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

This is an example of the command used to import an existing ECDSA key named 'test' with a specified private key. The CLI will prompt for a password to encrypt the imported private key for secure storage.

```Shell
eigenlayer operator keys import --key-type ecdsa test 6842fb8f5fa574d0482818b8a825a15c4d68f542693197f2c2497e3562f335f6
```

--------------------------------

### Adding Go Binary Path (GOBIN) to System PATH

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

These commands add the Go binary installation directory (`$GOPATH/bin`, typically aliased as `$GOBIN`) to the system's PATH environment variable. This ensures that Go executables, including the EigenLayer CLI, can be run from any directory in the terminal.

```Bash
export GOBIN=$GOPATH/bin
export PATH=$GOBIN:$PATH
```

--------------------------------

### Example: Importing an ECDSA Key with CLI

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This example illustrates how to import an existing ECDSA key named 'test' with a specified private key using the `eigenlayer` CLI. The command will prompt for a password to encrypt the imported private key, which is then stored locally.

```Shell
eigenlayer operator keys import --key-type ecdsa test 6842fb8f5fa574d0482818b8a825a15c4d68f542693197f2c2497e3562f335f6
```

--------------------------------

### Listing All EigenLayer Operator Keys

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This command retrieves and displays a list of all operator keys previously created or imported using the EigenLayer CLI tool. It shows the key names along with their corresponding public keys, aiding in key management and identification.

```Shell
eigenlayer operator keys list
```

--------------------------------

### Displaying EigenLayer Rewards Claim CLI Help

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This command displays the help documentation for the `eigenlayer rewards claim` CLI subcommand. It provides information on available options, parameters, and usage examples for claiming rewards, useful for understanding different key management methods like private key hex, Fireblocks, or Web3Signer.

```bash
./bin/eigenlayer rewards claim --help
```

--------------------------------

### Adding EigenLayer CLI Binary to PATH

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/operators-developer-docs.txt

This command adds the `~/bin` directory, where the EigenLayer CLI binary is installed, to the system's PATH environment variable. This allows the `eigenlayer` command to be executed from any directory in the terminal.

```Bash
export PATH=$PATH:~/bin
```

--------------------------------

### Verifying RPC Provider Connectivity (Shell)

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/docs/operators/howto/operator-installation.md

This `curl` command is used to verify network connectivity from the operator server to the configured Ethereum RPC node provider. It helps ensure the RPC endpoint is reachable before proceeding with registration.

```Shell
curl -I [your_server_url]
```

--------------------------------

### Adding EigenLayer CLI to System PATH

Source: https://github.com/layr-labs/eigenlayer-docs/blob/main/static/llms-full.txt

This command appends the `~/bin` directory, where the EigenLayer CLI binary is installed, to the system's PATH environment variable. This allows the `eigenlayer` command to be executed from any directory in the terminal without specifying its full path.

```Bash
export PATH=$PATH:~/bin
```