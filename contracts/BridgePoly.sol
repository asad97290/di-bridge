// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./utils/ECDSA.sol";
import "./utils/Errors.sol";

/**
 * @title BridgePoly
 * @dev A smart contract for handling the locking and unlocking of assets on the Polygon (Matic) network.
 *      Users can lock funds into the contract, and an administrator can unlock funds to a specified recipient after signature verification.
 */
contract BridgePoly is ECDSA {
    // Address of the administrator
    address public admin;

    // Mapping to track processed nonces for each address
    mapping(address => mapping(uint => bool)) public processedNonces;

    // Mapping to track the locked balance of each address
    mapping(address => uint) public lockBalance;

    // Enumeration representing the steps of a transfer: Lock or Unlock
    enum Step {
        Lock,
        UnLock
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
     * @dev Constructor function to initialize the BridgePoly contract.
     *      Sets the contract's administrator to the deployer's address.
     */
    constructor() payable{ // payable function cost less gas
        admin = msg.sender;
    }

    /**
     * @dev Modifier to ensure that a function is only callable by the administrator.
     */
    modifier onlyAdmin() {
        // Revert if the sender is not the administrator
        if (!(msg.sender == admin)) {
            revert OnlyAdmin();
        }
        _;
    }

    /**
     * @dev Function to lock funds into the contract.
     * @param nonce Unique identifier for the transfer to prevent replay attacks.
     * @param signature The cryptographic signature to validate the transaction.
     */
    function lock(uint nonce, bytes calldata signature) external payable {
        // Obtain the amount sent in the transaction
        uint amount = msg.value;

        // Obtain the sender's address
        address msgSender = msg.sender;

        // Revert if the amount is not positive
        if (amount <= 0) {
            revert ZeroAmount();
        }

        // Revert if the transfer has already been processed
        if (processedNonces[msgSender][nonce]) {
            revert TransferAlreadyProcessed();
        }

        // Mark the transfer as processed
        unchecked {
            lockBalance[msgSender] += amount;
        }

        // Emit the Transfer event for the lock operation
        emit Transfer(
            msgSender,
            address(this),
            amount,
            block.timestamp,
            nonce,
            signature,
            Step.Lock
        );
    }

    /**
     * @dev Function to unlock funds to a specified recipient after signature verification.
     * @param from The address from which the funds are unlocked.
     * @param to The address to which the funds are sent.
     * @param amount The amount of funds to be unlocked.
     * @param nonce Unique identifier for the transfer to prevent replay attacks.
     * @param signature The cryptographic signature to validate the transaction.
     */
    function unLock(
        address from,
        address to,
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external onlyAdmin {
        // Revert if the amount is not positive
        if (amount <= 0) {
            revert ZeroAmount();
        }

        if(from == address(0) || to == address(0)){
            revert ZeroAddress();
        }

        // Create a unique message hash
        bytes32 message = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));

        // Revert if the signature verification fails
        if (!(recoverSigner(message, signature) == to)) {
            revert WrongSignature();
        }

        // Revert if the transfer has already been processed
        if (processedNonces[from][nonce]) {
            revert TransferAlreadyProcessed();
        }

        // Mark the transfer as processed
        processedNonces[from][nonce] = true;

        // Deduct the unlocked amount from the lock balance
        lockBalance[to] -= amount;

        // Transfer the unlocked funds to the specified recipient
        (bool s, ) = payable(to).call{value: amount}("");
        if (!s) {
            revert TransferFailed();
        }

        // Emit the Transfer event for the unlock operation
        emit Transfer(
            from,
            to,
            amount,
            block.timestamp,
            nonce,
            signature,
            Step.UnLock
        );
    }

    /**
     * @dev Fallback function to allow the contract to receive funds.
     */
    receive() external payable {}
}
