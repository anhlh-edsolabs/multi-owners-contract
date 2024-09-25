require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");
const { Helper } = require("./helper");

const DEBUG = {
    status: false
}

const testLog = (() => {
	return DEBUG.status ? log : () => {};
})();

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
        testLog("Mock WUSD deployed at:", mockWUSDAddress);
        testLog("StakingClaim deployed at:", stakingClaimAddress);
        testLog("Contract admin address:", contractAdmin.address);
        testLog("First owner address:", firstOwner.address);
        testLog("Second owner address:", secondOwner.address);
        testLog("Third owner address:", thirdOwner.address);
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

async function createClaimDataMultiple(
    domain,
    claimers,
    claimableTimestamps,
    claimAmounts,
) {
    const stakingClaim = await hre.ethers.getContractFactory("StakingClaim");

    const [accessKeys, claimDataMultiple] = generateClaimDataList(claimers, claimableTimestamps, claimAmounts);

    const selector = stakingClaim.interface.getFunction(
        "createClaimDataMultiple",
    ).selector;

    const inputData = ethers.AbiCoder.defaultAbiCoder().encode(
        [
            "tuple(address account,uint48 claimableTimestamp,uint256 amount,bytes32 accessKey)[]",
        ],
        [claimDataMultiple],
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

    return [accessKeys, typedData];
}

function generateClaimDataList(claimers, claimableTimestamps, claimAmounts) {
    const accessKeys = [];

    const claimDataMultiple = claimers.map((claimer, index) => {
        const claimableTimestamp = claimableTimestamps[index];
        const claimAmount = claimAmounts[index];

        const accessKey = ethers.solidityPackedKeccak256(
            ["address", "uint48", "uint256"],
            [claimer, claimableTimestamp, claimAmount],
        );

        accessKeys.push(accessKey);

        return {
            account: claimer,
            claimableTimestamp,
            amount: claimAmount,
            accessKey,
        };
    });

    return [accessKeys, claimDataMultiple];
}

function generateClaimData(numberOfClaims) {
    const claimers = [];
    const claimableTimestamps = [];
    const claimAmounts = [];

    for (let i = 0; i < numberOfClaims; i++) {
        claimers.push(ethers.Wallet.createRandom().address);
        claimableTimestamps.push(1725148800);
        claimAmounts.push(ethers.parseUnits("1000", 6));
    }

    return [claimers, claimableTimestamps, claimAmounts];
}

module.exports = {
    testLog,
    DEBUG,
    Fixtures: {
        init,
        createClaimData,
        createClaimDataMultiple,
        generateClaimData,
        generateClaimDataList,
    },
};
