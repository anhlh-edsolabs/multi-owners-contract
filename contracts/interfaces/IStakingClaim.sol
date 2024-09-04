// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Claim {
    uint256 amount;
    uint256 claimedAt;
}

struct ClaimData {
    address account;
    uint48 claimableTimestamp;
    uint256 amount;
    bytes32 accessKey;
}

interface IStakingClaim {
    error ClaimedAlready();
    error UnauthorizedSigner(address account);
    error CallerIsNotOwner(address account);
    error InvalidAccessKey(bytes32 accessKey, bytes32 verifyingKey);
    error ExecutionForbidden();
    error ExecutionFailed(bytes payload, bytes returnData);

    event ClaimDataCreated(
        address indexed account,
        uint48 claimableTimestamp,
        uint256 amount,
        bytes32 accessKey
    );
    event Claimed(address indexed account, uint256 amount, uint256 claimedAt);
    event SigChecked(bytes[] signatures);
}
