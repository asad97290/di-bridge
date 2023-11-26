// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract BridgePoly {
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
        require(msg.sender == admin, "only admin");
        _;
    }

    function lock(uint nonce, bytes calldata signature) external payable {
        uint amount = msg.value;
        require(amount > 0, "amount must be greater than zero");
        require(
            processedNonces[msg.sender][nonce] == false,
            "transfer already processed"
        );
        processedNonces[msg.sender][nonce] = true;
        unchecked {
            lockBalance[msg.sender] += amount;
        }
        emit Transfer(
            msg.sender,
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
        require(amount > 0, "amount must be greater than zero");

        bytes32 message = prefixed(
            keccak256(abi.encodePacked(from, to, amount, nonce))
        );
        require(recoverSigner(message, signature) == to, "wrong signature");
        require(
            processedNonces[from][nonce] == false,
            "transfer already processed"
        );
        processedNonces[from][nonce] = true;
        lockBalance[to] -= amount;
        (bool s, ) = payable(to).call{value: amount}("");
        require(s, "Transfer Failed");
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

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }

    function recoverSigner(
        bytes32 message,
        bytes memory sig
    ) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) internal pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }

    receive() external payable {}
}
