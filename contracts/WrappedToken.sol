// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract WrappedToken is ERC20{
address public admin;

constructor(string memory name, string memory symbol) ERC20(name, symbol) {
    admin = msg.sender;

}
function updateAdmin(address newAdmin) external {
    admin = newAdmin;
}
function mint(address to, uint amount) external {
    _mint(to, amount);
}
function burn(address owner, uint amount) external {
    _burn(owner, amount);
}
}