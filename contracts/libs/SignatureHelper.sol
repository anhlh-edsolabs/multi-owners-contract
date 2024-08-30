// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

uint256 constant SIG_LENGTH = 65;

error InvalidSignatureLength(bytes signature, uint256 length);
error DuplicateSigner(address signer);

library SignatureHelper {
    function extractSignaturesFromCalldataInput(
        bytes calldata combinedSignature
    ) internal pure returns (bytes[] memory signatures) {
        uint256 combinedSigLength = combinedSignature.length;

        if (combinedSigLength == 0 || combinedSigLength % SIG_LENGTH != 0) {
            revert InvalidSignatureLength(combinedSignature, combinedSigLength);
        }

        uint256 sigCount = combinedSigLength / SIG_LENGTH;

        signatures = new bytes[](sigCount);

        for (uint256 i = 0; i < sigCount; i++) {
            bytes memory signature = new bytes(SIG_LENGTH);

            assembly {
                calldatacopy(
                    add(signature, 0x20),
                    add(combinedSignature.offset, mul(i, SIG_LENGTH)),
                    SIG_LENGTH
                )
            }

            signatures[i] = signature;
        }
    }

    function extractSignaturesFromMemoryInput(
        bytes memory combinedSignature
    ) internal pure returns (bytes[] memory signatures) {
        uint256 combinedSigLength = combinedSignature.length;

        if (combinedSigLength == 0 || combinedSigLength % SIG_LENGTH != 0) {
            revert InvalidSignatureLength(combinedSignature, combinedSigLength);
        }

        uint256 sigCount = combinedSigLength / SIG_LENGTH;

        signatures = new bytes[](sigCount);

        for (uint256 i = 0; i < sigCount; i++) {
            bytes memory signature = new bytes(SIG_LENGTH);

            assembly {
                let offset := mul(i, SIG_LENGTH)
                mstore(
                    add(signature, 0x20),
                    mload(add(combinedSignature, add(0x20, offset)))
                )
                mstore(
                    add(signature, 0x40),
                    mload(add(combinedSignature, add(0x40, offset)))
                )
                mstore8(
                    add(signature, 0x60),
                    byte(0, mload(add(combinedSignature, add(0x60, offset))))
                )
            }

            signatures[i] = signature;
        }
    }

    function recoverAndValidateSigners(
        bytes32 digest,
        bytes[] memory signatures
    ) internal pure returns (address[] memory signers) {
        signers = new address[](signatures.length);

        for (uint256 i = 0; i < signatures.length; i++) {
            signers[i] = ECDSA.recover(digest, signatures[i]);

            if (i > 0 && signers[i] == signers[i - 1]) {
                revert DuplicateSigner(signers[i]);
            }
        }
    }
}
