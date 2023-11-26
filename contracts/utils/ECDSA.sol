// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ECDSA
 * @dev An abstract contract providing utility functions for handling ECDSA signatures.
 */
abstract contract ECDSA {

    /**
     * @dev Internal function to prefix a given hash as per the Ethereum Signed Message format.
     * @param hash The hash to be prefixed.
     * @return The prefixed hash.
     */
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
    }

    /**
     * @dev Internal function to recover the signer's address from a message hash and signature.
     * @param message The message hash.
     * @param sig The signature.
     * @return The address of the signer.
     */
    function recoverSigner(
        bytes32 message,
        bytes memory sig
    ) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    /**
     * @dev Internal function to split an ECDSA signature into its components.
     * @param sig The signature.
     * @return The components of the signature: v, r, s.
     */
    function splitSignature(
        bytes memory sig
    ) internal pure returns (uint8, bytes32, bytes32) {
        // Ensure the signature length is correct
        require(sig.length == 65, "Invalid signature length");

        // Declare variables to store signature components
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Extract signature components using assembly
        assembly {
            // Load the first 32 bytes (r) from the signature
            r := mload(add(sig, 32))
            // Load the next 32 bytes (s) from the signature
            s := mload(add(sig, 64))
            // Load the final byte (v) from the signature
            v := byte(0, mload(add(sig, 96)))
        }

        // Return the signature components
        return (v, r, s);
    }

}
