// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import "./utils/ECDSA.sol";
import "./utils/Errors.sol";


contract BridgePoly is ECDSA{
    address public admin;

    mapping(address => mapping(uint => bool)) public processedNonces;
    mapping(address => uint) public lockBalance;
    enum Step {
        Lock,
        UnLock
    }
    event Transfer(
        address from,
        address to,
        uint amount,
        uint date,
        uint nonce,
        bytes signature,
        Step indexed step
    );

    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        if(!(msg.sender == admin)){
            revert OnlyAdmin();
        }
        _;
    }

    function lock(uint nonce, bytes calldata signature) external payable {
        uint amount = msg.value;
        address msgSender = msg.sender;

        if(amount <= 0){
            revert ZeroAmount();
        }
         if(
            processedNonces[msgSender][nonce]
            
        ){
            revert TransferAlreadyProcessed();
        }
        processedNonces[msgSender][nonce] = true;
        unchecked {
            lockBalance[msgSender] += amount;
        }
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

    function unLock(
        address from,
        address to,
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external onlyAdmin {
          if(amount <= 0){
            revert ZeroAmount();
        }
        bytes32 message = prefixed(
            keccak256(abi.encodePacked(from, to, amount, nonce))
        );
        if(!(recoverSigner(message, signature) == to)){
            revert WrongSignature();
        }
         if(
            processedNonces[from][nonce]
            
        ){
            revert TransferAlreadyProcessed();
        }
        processedNonces[from][nonce] = true;
        lockBalance[to] -= amount;
        (bool s, ) = payable(to).call{value: amount}("");
        if(!s){
            revert TransferFailed();
        } 
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

   

  

    receive() external payable {}
}
