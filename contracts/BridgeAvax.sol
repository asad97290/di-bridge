// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@openzeppelin/contracts/access/AccessControl.sol';
import "./WrappedToken.sol";
import "./utils/ECDSA.sol";
import "./utils/Errors.sol";

contract BridgeAvax is AccessControl, ECDSA {
    address public admin;
    WrappedToken public token;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(address => mapping(uint => bool)) public processedNonces;
    enum Step {
        Burn,
        Mint
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


    constructor(address _token) {
        admin = msg.sender;
        token = WrappedToken(_token);
        token.grantRole(MINTER_ROLE, admin);
        token.grantRole(MINTER_ROLE, address(this));
    }

   
  

    function mint(
        address from,
        address to,
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external onlyRole(MINTER_ROLE){
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
        token.mint(to, amount);
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

     function burn(
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external {
        address msgSender = msg.sender;
        if(
            processedNonces[msgSender][nonce]
            
        ){
            revert TransferAlreadyProcessed();
        }
        processedNonces[msgSender][nonce] = true;
        token.burn(msgSender, amount);
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
