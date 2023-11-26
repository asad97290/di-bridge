// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import '@openzeppelin/contracts/access/AccessControl.sol';

contract WrappedToken is ERC20, AccessControl {
    address public admin;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        admin = msg.sender;
    }

    function updateAdmin(address newAdmin) external {
        admin = newAdmin;
    }

    function mint(address to, uint amount) external onlyRole(MINTER_ROLE){
        _mint(to, amount);
    }

    function burn(address owner, uint amount) external onlyRole(MINTER_ROLE){
        _burn(owner, amount);
    }
}
