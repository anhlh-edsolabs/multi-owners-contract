require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");

async function init(printOutput = true) {
    const [contractAdmin, firstOwner, secondOwner, thirdOwner] =
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
        accounts: [contractAdmin, firstOwner, secondOwner, thirdOwner],
        mockWUSDAddress,
        mockWUSDContract,
        stakingClaimAddress,
        stakingClaimContract,
    };
}

module.exports = { init };
