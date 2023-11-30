// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title WrappedToken
 * @dev A simple ERC20 token contract that allows minting and burning of tokens.
 *      This contract is used to represent assets on a blockchain in a wrapped form.
 */
contract WrappedToken is ERC20 {
    // Address of the administrator
    address public admin;

    /**
     * @dev Constructor function to initialize the WrappedToken contract.
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Set the deployer's address as the administrator
        admin = msg.sender;
    }

    /**
     * @dev Function to update the administrator of the token contract.
     * @param newAdmin The address of the new administrator.
     */
    function updateAdmin(address newAdmin) external {
        // Update the administrator only if the caller is the current administrator
        if (msg.sender == admin) {
            admin = newAdmin;
        }
    }

    /**
     * @dev Function to mint new tokens and assign them to a specified address.
     * @param to The address to which the new tokens are minted.
     * @param amount The amount of tokens to be minted.
     */
    function mint(address to, uint amount) external {
        // Call the internal _mint function from ERC20 to create new tokens
        _mint(to, amount);
    }

    /**
     * @dev Function to burn existing tokens from a specified owner's balance.
     * @param owner The address from which the tokens are burned.
     * @param amount The amount of tokens to be burned.
     */
    function burn(address owner, uint amount) external {
        // Call the internal _burn function from ERC20 to destroy tokens
        _burn(owner, amount);
    }
}
