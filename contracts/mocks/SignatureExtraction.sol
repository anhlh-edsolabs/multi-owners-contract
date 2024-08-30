// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SignatureExtraction {
    uint256 public constant SIG_LENGTH = 65;

    event SigChecked(bytes[] signatures);
    error InvalidSignatureLength(bytes signature, uint256 length);

    function extractSignatures(
        bytes memory combinedSignature
    ) public returns (bytes[] memory signatures) {
        uint256 combinedSigLength = combinedSignature.length;

        if (combinedSigLength == 0 || combinedSigLength % SIG_LENGTH != 0) {
            revert InvalidSignatureLength(combinedSignature, combinedSigLength);
        }

        uint256 sigCount = combinedSigLength / SIG_LENGTH;

        signatures = new bytes[](sigCount);

        for(uint256 i = 0; i < sigCount; i++) {
            bytes memory signature = new bytes(SIG_LENGTH);

            assembly {
                let offset := mul(i, SIG_LENGTH)
                mstore(add(signature, 0x20), mload(add(combinedSignature, add(0x20, offset))))
                mstore(add(signature, 0x40), mload(add(combinedSignature, add(0x40, offset))))
                mstore8(add(signature, 0x60), byte(0, mload(add(combinedSignature, add(0x60, offset)))))
            }

            signatures[i] = signature;
        }

        emit SigChecked(signatures);
    }

    function extractSignatures1(
        bytes calldata combinedSignature
    ) public returns (bytes[] memory signatures) {
        uint256 combinedSigLength = combinedSignature.length;

        if (combinedSigLength == 0 || combinedSigLength % SIG_LENGTH != 0) {
            revert InvalidSignatureLength(combinedSignature, combinedSigLength);
        }

        uint256 sigCount = combinedSigLength / SIG_LENGTH;

        signatures = new bytes[](sigCount);

        for(uint256 i = 0; i < sigCount; i++) {
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

        emit SigChecked(signatures);
    }

    function extractSignatures2(
        bytes calldata combinedSignature
    ) public returns (bytes[] memory signatures) {
        uint256 combinedSigLength = combinedSignature.length;

        if (combinedSigLength == 0 || combinedSigLength % SIG_LENGTH != 0) {
            revert InvalidSignatureLength(combinedSignature, combinedSigLength);
        }

        uint256 sigCount = combinedSigLength / SIG_LENGTH;

        signatures = new bytes[](sigCount);
       
        for(uint256 i = 0; i < sigCount; i++) {
            bytes memory signature = new bytes(SIG_LENGTH);

            signature = bytes(
                combinedSignature[i * SIG_LENGTH:(i + 1) * SIG_LENGTH]
            );

            signatures[i] = signature;
        }

        emit SigChecked(signatures);
    }

    function extractSignatures3(
        bytes calldata combinedSignature
    ) public returns (bytes[] memory signatures) {
        uint256 combinedSigLength = combinedSignature.length;

        if (combinedSigLength == 0 || combinedSigLength % SIG_LENGTH != 0) {
            revert InvalidSignatureLength(combinedSignature, combinedSigLength);
        }

        uint256 sigCount = combinedSigLength / SIG_LENGTH;

        signatures = new bytes[](sigCount);
         for (uint256 i = 0; i < sigCount; i++) {
            bytes memory signature = new bytes(SIG_LENGTH);
            for (uint256 j = 0; j < SIG_LENGTH; j++) {
                signature[j] = combinedSignature[i * SIG_LENGTH + j];
            }
            signatures[i] = signature;
        }

        emit SigChecked(signatures);
    }
}
