require("dotenv").config();
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");
const { expect } = require("chai");
const { Helper } = require("./helper");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { init, createClaimData } = require("./fixture");

const domain = {
    name: "StakingClaim",
    version: "1",
    chainId: 31337,
    // verifyingContract: stakingClaim.target,
};

describe("StakingClaim", () => {
    let contractAdmin, firstOwner, secondOwner, thirdOwner, user1;
    let mockWUSD, stakingClaim;

    before(async () => {
        const { accounts, mockWUSDContract, stakingClaimContract } =
            await loadFixture(init);
        [contractAdmin, firstOwner, secondOwner, thirdOwner, user1] = accounts;
        mockWUSD = mockWUSDContract;
        stakingClaim = stakingClaimContract;

        domain.verifyingContract = stakingClaim.target;
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
        it("Sign and verify a Typed data message", async () => {
            const claimableTimestamp = 1725148800;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            const signature = await Helper.signTypedData(typedData, firstOwner);

            const digest = ethers.TypedDataEncoder.hash(
                typedData.domain,
                typedData.types,
                typedData.message,
            );

            // const signingKey = new ethers.SigningKey(ethers.getBytes(privKey));
            const recoveredAddress = ethers.computeAddress(
                ethers.SigningKey.recoverPublicKey(digest, signature),
            );

            expect(
                (await stakingClaim.recoverSigner(digest, signature))[0],
            ).to.deep.eq(recoveredAddress);
        });
    });

    describe("Create Claim Data", () => {
        it("Should revert with CallerIsNotOwner if executed by a non-owner", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            const signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
                secondOwner,
                thirdOwner,
            ]);

            const combinedSignatures = ethers.concat(signatures);

            await expect(
                stakingClaim
                    .connect(user1)
                    .execute(
                        typedData.message.selector,
                        typedData.message.inputData,
                        combinedSignatures,
                    ),
            )
                .to.be.revertedWithCustomError(stakingClaim, "CallerIsNotOwner")
                .withArgs(user1.address);
        });

        it("Should revert with UnauthorizedSigner if executed with invalid signatures", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            const signatures = await Helper.signTypedDataMultiple(typedData, [
                user1,
                secondOwner,
                thirdOwner,
            ]);

            const combinedSignatures = ethers.concat(signatures);

            await expect(
                stakingClaim
                    .connect(firstOwner)
                    .execute(
                        typedData.message.selector,
                        typedData.message.inputData,
                        combinedSignatures,
                    ),
            )
                .to.be.revertedWithCustomError(
                    stakingClaim,
                    "UnauthorizedSigner",
                )
                .withArgs(user1.address);
        });

        it("Should revert if Claim Data already exists", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            const signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
                secondOwner,
                thirdOwner,
            ]);

            const combinedSignatures = ethers.concat(signatures);

            await stakingClaim
                .connect(firstOwner)
                .execute(
                    typedData.message.selector,
                    typedData.message.inputData,
                    combinedSignatures,
                );

            await expect(
                stakingClaim
                    .connect(firstOwner)
                    .execute(
                        typedData.message.selector,
                        typedData.message.inputData,
                        combinedSignatures,
                    ),
            )
                .to.be.revertedWithCustomError(stakingClaim, "OverwritingClaim")
                .withArgs(user1.address, accessKey);
        });

        it("Should successfully create Claim Data for user1", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            log({ accessKey });
            log(typedData);

            const signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
                secondOwner,
                thirdOwner,
            ]);

            const combinedSignatures = ethers.concat(signatures);

            log({ signatures });
            log({ combinedSignatures });

            expect(await stakingClaim.isOwner(firstOwner.address)).to.be.true;
            expect(await stakingClaim.isOwner(secondOwner.address)).to.be.true;
            expect(await stakingClaim.isOwner(thirdOwner.address)).to.be.true;

            await expect(
                stakingClaim
                    .connect(firstOwner)
                    .execute(
                        typedData.message.selector,
                        typedData.message.inputData,
                        combinedSignatures,
                    ),
            )
                .to.emit(stakingClaim, "ClaimDataCreated")
                .withArgs(
                    user1.address,
                    claimableTimestamp,
                    claimAmount,
                    accessKey,
                );

            const claimDataByUser = await stakingClaim.getClaimData(
                user1.address,
                accessKey,
            );

            expect(claimDataByUser).to.deep.eq([claimAmount, 0]);
        });
    });
});
