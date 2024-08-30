require("dotenv").config();
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { init } = require("./fixture");
const { sign } = require("crypto");

describe("StakingClaim", () => {
    let contractAdmin, firstOwner, secondOwner, thirdOwner;
    let mockWUSD, stakingClaim;

    before(async () => {
        const { accounts, mockWUSDContract, stakingClaimContract } =
            await loadFixture(init);
        [contractAdmin, firstOwner, secondOwner, thirdOwner] = accounts;
        mockWUSD = mockWUSDContract;
        stakingClaim = stakingClaimContract;
    });

    describe("Deployment", () => {
        it("StakingClaim's Base token must be the MockWUSD address", async () => {
            expect(await stakingClaim.getBaseToken()).to.equal(mockWUSD.target);
        });

        it("Contract Admin account must have the DEFAULT_ADMIN_ROLE", async () => {
            expect(
                await stakingClaim.hasRole(
                    await stakingClaim.DEFAULT_ADMIN_ROLE(),
                    contractAdmin.address,
                ),
            ).to.be.true;
        });

        it("All owners have been setup", async () => {
            // const owners = await stakingClaim.getOwners();
            // log("Owners:", owners);
            expect(await stakingClaim.getOwners()).to.deep.eq([
                firstOwner.address,
                secondOwner.address,
                thirdOwner.address,
            ]);
        });
    });
});
