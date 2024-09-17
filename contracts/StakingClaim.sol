// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Base} from "./base/Base.sol";
import {Validation, BoolUtils} from "./libs/Utils.sol";
import "./libs/SignatureHelper.sol";
import "./interfaces/IStakingClaim.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

contract StakingClaim is Base, EIP712Upgradeable, IStakingClaim {
    using SafeERC20 for IERC20;

    /** EIP712 type hashes */
    bytes32 constant EIP712_FUNCTION_CALL_TYPEHASH =
        keccak256("FunctionCall(bytes4 selector,bytes inputData)");

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address immutable BASE_TOKEN;

    /** Storage */
    /// @custom:storage-location erc7201:stableFlow.storage.SoftStakingClaimStorage
    struct StakingClaimStorage {
        address[] _owners;
        // Claim data for each account: account => keccak256(abi.encodePacked(account, claimableTimestamp, amount)) => Claim
        mapping(address => mapping(bytes32 => Claim)) _claims;
        mapping(address => bytes32[]) _claimList;
    }

    // keccak256(abi.encode(uint256(keccak256("stableFlow.storage.SoftStakingClaimStorage")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant StakingClaimStorageSlot =
        0x1bcf8f46d034a5097408092e714b2615fc1df5a12ad20c9e2a147a8c983af700;

    /** Read storage slot */
    function _getStakingClaimStorage()
        internal
        pure
        returns (StakingClaimStorage storage $)
    {
        assembly {
            $.slot := StakingClaimStorageSlot
        }
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address baseToken) {
        BASE_TOKEN = baseToken;
    }

    function initialize(
        address initialAdmin,
        address firstOwner,
        address secondOwner,
        address thirdOwner
    ) external initializer {
        __Base_init(initialAdmin);
        __EIP712_init("StakingClaim", "1");

        Validation.noZeroAddress(firstOwner);
        Validation.noZeroAddress(secondOwner);
        Validation.noZeroAddress(thirdOwner);

        StakingClaimStorage storage $ = _getStakingClaimStorage();
        $._owners = new address[](3);
        $._owners[0] = firstOwner;
        $._owners[1] = secondOwner;
        $._owners[2] = thirdOwner;
    }

    modifier onlyThisContract() {
        _onlyThisContract();
        _;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyThisContract() private view {
        if (_msgSender() != address(this)) {
            revert ExecutionForbidden();
        }
    }

    function _onlyOwner() private view {
        if (!isOwner(_msgSender())) {
            revert CallerIsNotOwner(_msgSender());
        }
    }

    /* Main execution functions */
    function execute(
        bytes4 selector,
        bytes calldata inputData,
        bytes calldata combinedSignatures
    ) external onlyOwner returns (bool) {
        bytes[] memory signatures = SignatureHelper
            .extractSignaturesFromCalldataInput(combinedSignatures);

        bytes32 digest = getEIP712FunctionCallDigest(selector, inputData);

        // validate signers
        address[] memory signers = SignatureHelper.recoverAndValidateSigners(
            digest,
            signatures
        );

        for (uint256 i = 0; i < signers.length; i++) {
            if (!isOwner(signers[i])) {
                revert UnauthorizedSigner(signers[i]);
            }
        }

        bytes memory callPayload = abi.encodePacked(selector, inputData);

        (bool success, bytes memory result) = address(this).call{
            gas: gasleft()
        }(callPayload);

        if (!success) {
            // bubble up the revert reason from lower level call
            assembly {
                revert(add(result, 0x20), mload(result))
            }
        }

        return success;
    }

    /** Claim data */
    function createClaimData(
        address account,
        uint48 claimableTimestamp,
        uint256 amount,
        bytes32 accessKey
    ) public onlyThisContract {
        _createClaim(account, claimableTimestamp, amount, accessKey);
    }

    function createClaimDataMultiple(
        ClaimData[] memory claimDataList
    ) public onlyThisContract {
        for (uint256 i = 0; i < claimDataList.length; i++) {
            ClaimData memory claimData = claimDataList[i];
            _createClaim(
                claimData.account,
                claimData.claimableTimestamp,
                claimData.amount,
                claimData.accessKey
            );
        }
    }

    function _createClaim(
        address account,
        uint48 claimableTimestamp,
        uint256 amount,
        bytes32 accessKey
    ) internal {
        // sanitize inputs
        Validation.noZeroAddress(account);

        bytes32 verifyingKey = keccak256(
            abi.encodePacked(account, claimableTimestamp, amount)
        );

        if (accessKey != verifyingKey) {
            revert InvalidAccessKey(accessKey, verifyingKey);
        }

        StakingClaimStorage storage $ = _getStakingClaimStorage();

        // check if claim already exists for this account and revert to prevent overwriting
        if ($._claims[account][accessKey].amount > 0) {
            revert OverwritingClaim(account, accessKey);
        }

        $._claims[account][accessKey] = Claim(amount, 0);
        $._claimList[account].push(accessKey);

        emit ClaimDataCreated(account, claimableTimestamp, amount, accessKey);
    }

    function getClaimData(
        address account,
        bytes32 accessKey
    ) external view returns (Claim memory) {
        StakingClaimStorage storage $ = _getStakingClaimStorage();
        return $._claims[account][accessKey];
    }

    function getBaseToken() external view returns (address) {
        return BASE_TOKEN;
    }

    function getOwners() external view returns (address[] memory) {
        StakingClaimStorage storage $ = _getStakingClaimStorage();
        return $._owners;
    }

    function isOwner(address account) public view returns (bool) {
        StakingClaimStorage storage $ = _getStakingClaimStorage();
        for (uint256 i = 0; i < $._owners.length; i++) {
            if ($._owners[i] == account) {
                return true;
            }
        }
        return false;
    }

    /*******************************************************/
    /** EIP-712 signature verification */

    function getEIP712FunctionCallStructHash(
        bytes4 selector,
        bytes calldata inputData
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    EIP712_FUNCTION_CALL_TYPEHASH,
                    selector,
                    keccak256(inputData)
                )
            );
    }

    function getEIP712FunctionCallDigest(
        bytes4 selector,
        bytes calldata inputData
    ) public view returns (bytes32) {
        bytes32 domainSeparator = _domainSeparatorV4();

        bytes32 structHash = getEIP712FunctionCallStructHash(
            selector,
            inputData
        );

        return MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
    }

    function recoverSigner(
        bytes32 digest,
        bytes calldata combinedSignatures
    ) public pure returns (address[] memory) {
        bytes[] memory signatures = SignatureHelper
            .extractSignaturesFromCalldataInput(combinedSignatures);

        return SignatureHelper.recoverAndValidateSigners(digest, signatures);
    }
}
