// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @dev This smart contract defines custom errors that can be thrown during specific conditions in other contracts.
 */

library CommanErrors{

    error OnlyAdmin();                 // Error thrown when a function is called by a non-administrator.
    error ZeroAmount();                // Error thrown when an operation involves an amount less than or equal to zero.
    error TransferAlreadyProcessed();  // Error thrown when attempting to process a transfer that has already been executed.
    error WrongSignature();            // Error thrown when a cryptographic signature verification fails.
    error TransferFailed();            // Error thrown when a fund transfer operation fails.
    error ZeroAddress();               // Error thrown when address is equal to zero address.

}