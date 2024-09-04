require("dotenv").config();
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");
const { expect } = require("chai");
const { Helper } = require("./helper");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { init } = require("./fixture");

describe("StakingClaim", () => {
    let contractAdmin, firstOwner, secondOwner, thirdOwner, user1;
    let mockWUSD, stakingClaim;

    before(async () => {
        const { accounts, mockWUSDContract, stakingClaimContract } =
            await loadFixture(init);
        [contractAdmin, firstOwner, secondOwner, thirdOwner, user1] = accounts;
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

    describe("Signatures", () => {
        let typedData;
        let domain;

        const privKey =
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

        before(async () => {
            domain = {
                name: "StakingClaim",
                version: "1",
                chainId: 31337,
                verifyingContract: stakingClaim.target,
            };
        });
        it("Sign and verify a message", async () => {
            const claimer = user1.address;
            const claimableTimestamp = 1725148800;
            const claimAmount = ethers.parseUnits("1000", 6);
            const accessKey = ethers.solidityPackedKeccak256(
                ["address", "uint48", "uint256"],
                [claimer, claimableTimestamp, claimAmount],
            );

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

            typedData = Helper.getTypedData(
                domain,
                Helper.FunctionCallType,
                Object.keys(Helper.FunctionCallType)[0],
                payload,
            );

            log(typedData);

            const signature = await Helper.signTypedData(typedData, firstOwner);

            log("Signature:", signature);

            const digest = ethers.TypedDataEncoder.hash(
                typedData.domain,
                typedData.types,
                typedData.message,
            );

            log("Digest:", digest);

            // const signingKey = new ethers.SigningKey(ethers.getBytes(privKey));
            const recoveredAddress = ethers.computeAddress(
                ethers.SigningKey.recoverPublicKey(digest, signature),
            );

            log("Recovered address:", recoveredAddress);

            expect(
                (await stakingClaim.recoverSigner(digest, signature))[0],
            ).to.deep.eq(recoveredAddress);
        });
    });
});
