// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Base} from "../base/Base.sol";
import {Validation, BoolUtils} from "../libs/Utils.sol";
import "../libs/SignatureHelper.sol";

contract OwnerManager is Base {
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    error CallerIsNotOwner(address account);
    error NotAnOwner(address account);

    /** Storage */
    /// @custom:storage-location erc7201:multiOwnerContract.storage.OwnerManagerStorage
    struct OwnerManagerStorage {
        address[] _owners;
        mapping(address => uint256) _ownerIndices;
    }

    // keccak256(abi.encode(uint256(keccak256("multiOwnerContract.storage.OwnerManagerStorage")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant OwnerManagerStorageSlot =
        0xd8456dda6d16d78b910c62ba1516f1089374865c27437c5b9072c85b40768700;

    /** Read storage slot */
    function _getOwnerManagerStorage()
        internal
        pure
        returns (OwnerManagerStorage storage $)
    {
        assembly {
            $.slot := OwnerManagerStorageSlot
        }
    }

    function initialize(
        address initialAdmin,
        address firstOwner,
        address secondOwner,
        address thirdOwner
    ) external initializer {
        __Base_init(initialAdmin);

        Validation.noZeroAddress(firstOwner);
        Validation.noZeroAddress(secondOwner);
        Validation.noZeroAddress(thirdOwner);

        // check if the owners are unique
        address[] memory owners = new address[](3);
        owners[0] = firstOwner;
        owners[1] = secondOwner;
        owners[2] = thirdOwner;

        if (SignatureHelper.hasDuplicates(owners)) {
            revert DuplicateSigner();
        }

        OwnerManagerStorage storage $ = _getOwnerManagerStorage();
        $._owners = owners;
        $._ownerIndices[firstOwner] = 0;
        $._ownerIndices[secondOwner] = 1;
        $._ownerIndices[thirdOwner] = 2;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() private view {
        if (!isOwner(_msgSender())) {
            revert CallerIsNotOwner(_msgSender());
        }
    }

    // function getOwners() external view returns (address[] memory) {
    //     OwnerManagerStorage storage $ = _getOwnerManagerStorage();
    //     return $._owners;
    // }

    function isOwner(address account) public view returns (bool) {
        OwnerManagerStorage storage $ = _getOwnerManagerStorage();
        for (uint256 i = 0; i < $._owners.length; i++) {
            if ($._owners[i] == account) {
                return true;
            }
        }
        return false;
    }

    function changeOwnerWithIndexMarker(
        address currentOwner,
        address newOwner
    ) external onlyOwner {
        OwnerManagerStorage storage $ = _getOwnerManagerStorage();

        // set ownerIndex to max value to check if owner was found
        uint256 ownerIndex = type(uint256).max;

        // find the index of the current owner, if matched set ownerIndex to the index and exit loop
        for (uint256 i = 0; i < $._owners.length; i++) {
            if ($._owners[i] == currentOwner) {
                ownerIndex = i;
                break;
            }
        }

        // if ownerIndex is still max value, then the currentOwner was not found
        if (ownerIndex == type(uint256).max) {
            revert NotAnOwner(currentOwner);
        }

        // if the currenOwner was found, replace it with the newOwner
        $._owners[ownerIndex] = newOwner;

        emit OwnerChanged(currentOwner, newOwner);
    }

    function changeOwnerWithArrayIteration(
        address currentOwner,
        address newOwner
    ) external onlyOwner {
        OwnerManagerStorage storage $ = _getOwnerManagerStorage();

        if (!isOwner(currentOwner)) {
            revert NotAnOwner(currentOwner);
        }

        for (uint256 i = 0; i < $._owners.length; i++) {
            if ($._owners[i] == currentOwner) {
                $._owners[i] = newOwner;
                emit OwnerChanged(currentOwner, newOwner);
                return;
            }
        }
    }

    function changeOwnerWithIndexMapping(
        address currentOwner,
        address newOwner
    ) external onlyOwner {
        OwnerManagerStorage storage $ = _getOwnerManagerStorage();

        uint256 ownerIndex = $._ownerIndices[currentOwner];

        if ($._owners[ownerIndex] != currentOwner) {
            revert NotAnOwner(currentOwner);
        }

        $._owners[ownerIndex] = newOwner;
        $._ownerIndices[newOwner] = ownerIndex;
        delete $._ownerIndices[currentOwner];

        emit OwnerChanged(currentOwner, newOwner);
    }
}
