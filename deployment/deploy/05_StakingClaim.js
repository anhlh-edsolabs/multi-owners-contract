const hre = require("hardhat");
const { DeployHelper } = require("../utils");
const { Contracts } = require("../../scripts/utils/artifacts");

async function main() {
    const CONTRACT_NAME = "StakingClaim";

    const [initialAdmin, firstOwner, secondOwner, thirdOwner] =
        await hre.ethers.getSigners();

    const INITIALIZATION_ARGS = [
        initialAdmin.address,
        firstOwner.address,
        secondOwner.address,
        thirdOwner.address,
    ];
    const IMPL_CONSTRUCTOR_ARGS = [Contracts.MockWUSD.target];

    await DeployHelper.deploy(
        CONTRACT_NAME,
        INITIALIZATION_ARGS,
        true,
        IMPL_CONSTRUCTOR_ARGS,
    );
}

main()
    .then(() => {})
    .catch((error) => {
        console.error(("Error:", error));
        process.exit(1);
    });
