// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Importing necessary OpenZeppelin contracts and custom utility contracts
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@openzeppelin/contracts/access/AccessControl.sol';
import "./WrappedToken.sol";
import "./utils/ECDSA.sol";
import "./utils/Errors.sol";

/**
 * @title BridgeAvax
 * @dev A smart contract for bridging assets between two networks using a wrapped token mechanism.
 *      This contract facilitates the burning and minting of tokens in a controlled manner.
 */
contract BridgeAvax is AccessControl, ECDSA {
    // Address of the administrator
    address public admin;

    // Reference to the wrapped token contract
    WrappedToken public token;

    // Role identifier for the token minter
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Mapping to track processed nonces for each address
    mapping(address => mapping(uint => bool)) public processedNonces;

    // Enumeration representing the steps of a transfer: Burn or Mint
    enum Step {
        Burn,
        Mint
    }

    // Event emitted when a transfer occurs
    event Transfer(
        address from,
        address to,
        uint amount,
        uint date,
        uint nonce,
        bytes signature,
        Step indexed step
    );

    /**
     * @dev Constructor function to initialize the BridgeAvax contract.
     * @param _token Address of the WrappedToken contract.
     */
    constructor(address _token) {
        admin = msg.sender;
        token = WrappedToken(_token);

        // Assigning the MINTER_ROLE to the administrator
        _grantRole(MINTER_ROLE, admin);
    }

    /**
     * @dev Mint function to create new tokens on the destination network after a valid signature verification.
     * @param from The address from which the tokens are burned.
     * @param to The address to which the new tokens are minted.
     * @param amount The amount of tokens to be minted.
     * @param nonce Unique identifier for the transfer to prevent replay attacks.
     * @param signature The cryptographic signature to validate the transaction.
     */
    function mint(
        address from,
        address to,
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external onlyRole(MINTER_ROLE) {
        // Creating a unique message hash
        bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));

        // Verifying the signature
        if (!(recoverSigner(message, signature) == to)) {
            revert WrongSignature();
        }

        // Checking if the transfer has already been processed
        if (processedNonces[from][nonce]) {
            revert TransferAlreadyProcessed();
        }

        // Marking the transfer as processed
        processedNonces[from][nonce] = true;

        // Minting the tokens on the destination network
        token.mint(to, amount);

        // Emitting the Transfer event
        emit Transfer(
            from,
            to,
            amount,
            block.timestamp,
            nonce,
            signature,
            Step.Mint
        );
    }

    /**
     * @dev Burn function to destroy tokens on the source network after a valid signature verification.
     * @param amount The amount of tokens to be burned.
     * @param nonce Unique identifier for the transfer to prevent replay attacks.
     * @param signature The cryptographic signature to validate the transaction.
     */
    function burn(
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external {
        // Obtaining the sender's address
        address msgSender = msg.sender;

        // Checking if the transfer has already been processed
        if (processedNonces[msgSender][nonce]) {
            revert TransferAlreadyProcessed();
        }

        // Marking the transfer as processed
        processedNonces[msgSender][nonce] = true;

        // Burning the tokens on the source network
        token.burn(msgSender, amount);

        // Emitting the Transfer event
        emit Transfer(
            msgSender,
            address(this),
            amount,
            block.timestamp,
            nonce,
            signature,
            Step.Burn
        );
    }
}
