require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");
const { Helper } = require("./helper");
const { access } = require("fs");

async function init(printOutput = true) {
    const [contractAdmin, firstOwner, secondOwner, thirdOwner, ...addrs] =
        await hre.ethers.getSigners();

    // deploy mock WUSD
    const MockWUSDFactory = await hre.ethers.getContractFactory("MockToken");
    const mockWUSDContract = await hre.upgrades.deployProxy(MockWUSDFactory, [
        "Worldwide USD",
        "WUSD",
        6,
    ]);
    await mockWUSDContract.waitForDeployment();
    const mockWUSDAddress = mockWUSDContract.target;

    const StakingClaimFactory =
        await hre.ethers.getContractFactory("StakingClaim");
    const stakingClaimContract = await hre.upgrades.deployProxy(
        StakingClaimFactory,
        [
            contractAdmin.address,
            firstOwner.address,
            secondOwner.address,
            thirdOwner.address,
        ],
        { constructorArgs: [mockWUSDAddress] },
    );

    await stakingClaimContract.waitForDeployment();
    const stakingClaimAddress = stakingClaimContract.target;

    if (printOutput) {
        log("Mock WUSD deployed at:", mockWUSDAddress);
        log("StakingClaim deployed at:", stakingClaimAddress);
        log("Contract admin address:", contractAdmin.address);
        log("First owner address:", firstOwner.address);
        log("Second owner address:", secondOwner.address);
        log("Third owner address:", thirdOwner.address);
    }

    return {
        accounts: [
            contractAdmin,
            firstOwner,
            secondOwner,
            thirdOwner,
            ...addrs,
        ],
        mockWUSDAddress,
        mockWUSDContract,
        stakingClaimAddress,
        stakingClaimContract,
    };
}

async function createClaimData(
    domain,
    claimer,
    claimableTimestamp,
    claimAmount,
) {
    // const claimer = user1.address;
    // const claimableTimestamp = 1725148800;
    // const claimAmount = ethers.parseUnits("1000", 6);
    const accessKey = ethers.solidityPackedKeccak256(
        ["address", "uint48", "uint256"],
        [claimer, claimableTimestamp, claimAmount],
    );

    const stakingClaim = await hre.ethers.getContractFactory("StakingClaim");

    const selector =
        stakingClaim.interface.getFunction("createClaimData").selector;
    const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint48", "uint256", "bytes32"],
        [claimer, claimableTimestamp, claimAmount, accessKey],
    );

    const payload = {
        selector,
        inputData,
    };

    const typedData = Helper.getTypedData(
        domain,
        Helper.FunctionCallType,
        Object.keys(Helper.FunctionCallType)[0],
        payload,
    );

    return [accessKey, typedData];
}

module.exports = { init, createClaimData };
