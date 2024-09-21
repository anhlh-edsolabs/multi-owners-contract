require("dotenv").config();
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");
const { expect } = require("chai");
const { Helper } = require("./helper");
const { BlockHelper } = require("../scripts/utils/blockHelper");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { Fixtures } = require("./fixture");

const domain = {
    name: "StakingClaim",
    version: "1",
    // chainId: 31337,
    // verifyingContract: stakingClaim.target,
};

describe("StakingClaim", () => {
    let contractAdmin,
        firstOwner,
        secondOwner,
        thirdOwner,
        user1,
        user2,
        user3,
        user4;
    let mockWUSD, stakingClaim;

    before(async () => {
        const { accounts, mockWUSDContract, stakingClaimContract } =
            await loadFixture(Fixtures.init);
        [
            contractAdmin,
            firstOwner,
            secondOwner,
            thirdOwner,
            user1,
            user2,
            user3,
            user4,
        ] = accounts;
        mockWUSD = mockWUSDContract;
        stakingClaim = stakingClaimContract;

        domain.verifyingContract = stakingClaim.target;
        domain.chainId = hre.network.config.chainId;
    });

    describe("Deployment", () => {
        it("Should revert if deployed with duplicate owners", async () => {
            const StakingClaimFactory =
                await hre.ethers.getContractFactory("StakingClaim");
            await expect(
                hre.upgrades.deployProxy(
                    StakingClaimFactory,
                    [
                        contractAdmin.address,
                        firstOwner.address,
                        firstOwner.address,
                        thirdOwner.address,
                    ],
                    { constructorArgs: [mockWUSD.target] },
                ),
            ).to.be.revertedWithCustomError(stakingClaim, "DuplicateSigner");
        });

        it("Should revert if deployed with MockWUSD address as zero", async () => {
            const StakingClaimFactory =
                await hre.ethers.getContractFactory("StakingClaim");
            await expect(
                hre.upgrades.deployProxy(
                    StakingClaimFactory,
                    [
                        contractAdmin.address,
                        firstOwner.address,
                        secondOwner.address,
                        thirdOwner.address,
                    ],
                    { constructorArgs: [ethers.ZeroAddress] },
                ),
            ).to.be.revertedWithCustomError(stakingClaim, "NoZeroAddress");
        });

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

            const [accessKey, typedData] = await Fixtures.createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
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

        it("Should revert with InvalidSignatureLength if signature length does not divide by 65", async () => {
            const invalidSignatures = ethers.randomBytes(66);
            const randomDigest = ethers.randomBytes(32);

            await expect(
                stakingClaim.recoverSigner(randomDigest, invalidSignatures),
            ).to.be.revertedWithCustomError(
                stakingClaim,
                "InvalidSignatureLength",
            );
        });

        it("Should revert with InvalidSignatureLength if signature length equals to 0", async () => {
            const invalidSignatures = ethers.randomBytes(0);
            const randomDigest = ethers.randomBytes(32);

            await expect(
                stakingClaim.recoverSigner(randomDigest, invalidSignatures),
            ).to.be.revertedWithCustomError(
                stakingClaim,
                "InvalidSignatureLength",
            );
        });
    });

    describe("Create Claim Data", () => {
        it("Should revert with ExecutionForbidden if createClaimData is called directly by a non-owner", async () => {
            const claimer = user1.address;
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);
            const accessKey = ethers.solidityPackedKeccak256(
                ["address", "uint48", "uint256"],
                [claimer, claimableTimestamp, claimAmount],
            );

            await expect(
                stakingClaim
                    .connect(user1)
                    .createClaimData(
                        claimer,
                        claimableTimestamp,
                        claimAmount,
                        accessKey,
                    ),
            ).to.be.revertedWithCustomError(stakingClaim, "ExecutionForbidden");
        });

        it("Should revert with ExecutionForbidden if createClaimData is called directly by an owner", async () => {
            const claimer = user1.address;
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);
            const accessKey = ethers.solidityPackedKeccak256(
                ["address", "uint48", "uint256"],
                [claimer, claimableTimestamp, claimAmount],
            );

            await expect(
                stakingClaim
                    .connect(firstOwner)
                    .createClaimData(
                        claimer,
                        claimableTimestamp,
                        claimAmount,
                        accessKey,
                    ),
            ).to.be.revertedWithCustomError(stakingClaim, "ExecutionForbidden");
        });

        it("Should revert with CallerIsNotOwner if executed by a non-owner", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await Fixtures.createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
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

            const [accessKey, typedData] = await Fixtures.createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
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

        it("Should revert with UnauthorizedSigner if signature is reused", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await Fixtures.createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
            );

            let digest1 = ethers.TypedDataEncoder.hash(
                typedData.domain,
                typedData.types,
                typedData.message,
            );

            console.log("Digest with valid nonce:", digest1);

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

            typedData.message.nonce++;

            let digest2 = ethers.TypedDataEncoder.hash(
                typedData.domain,
                typedData.types,
                typedData.message,
            );

            console.log("Invalid digest after nonce increased:", digest2);

            const expectedInvalidSigner = ethers.recoverAddress(
                digest2,
                signatures[0],
            );
            console.log(
                "Expected invalid signer recovered from invalid digest:",
                expectedInvalidSigner,
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
                .to.be.revertedWithCustomError(
                    stakingClaim,
                    "UnauthorizedSigner",
                )
                .withArgs(expectedInvalidSigner);
        });

        it("Should revert with OverwritingClaim if claim data already exists", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await Fixtures.createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
            );

            let signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
                secondOwner,
                thirdOwner,
            ]);

            let combinedSignatures = ethers.concat(signatures);

            await stakingClaim
                .connect(firstOwner)
                .execute(
                    typedData.message.selector,
                    typedData.message.inputData,
                    combinedSignatures,
                );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
            );

            signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
                secondOwner,
                thirdOwner,
            ]);

            combinedSignatures = ethers.concat(signatures);

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

        it("Should revert with DuplicateSigner if the same signer signs twice", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await Fixtures.createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
            );

            let signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
                firstOwner,
                thirdOwner,
            ]);

            let combinedSignatures = ethers.concat(signatures);

            await expect(
                stakingClaim
                    .connect(firstOwner)
                    .execute(
                        typedData.message.selector,
                        typedData.message.inputData,
                        combinedSignatures,
                    ),
            ).to.be.revertedWithCustomError(stakingClaim, "DuplicateSigner");

            signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
                secondOwner,
                firstOwner,
            ]);

            combinedSignatures = ethers.concat(signatures);

            await expect(
                stakingClaim
                    .connect(firstOwner)
                    .execute(
                        typedData.message.selector,
                        typedData.message.inputData,
                        combinedSignatures,
                    ),
            ).to.be.revertedWithCustomError(stakingClaim, "DuplicateSigner");
        });

        it("Should successfully create Claim Data for user1", async () => {
            const claimableTimestamp = Date.now() + 1000;
            const claimAmount = ethers.parseUnits("1000", 6);

            const [accessKey, typedData] = await Fixtures.createClaimData(
                domain,
                user1.address,
                claimableTimestamp,
                claimAmount,
            );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
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
    describe("Create Claim Data Multiple", () => {
        it("Should successfully create Claim Data for multiple users", async () => {
            const claimers = [
                user1.address,
                user2.address,
                user3.address,
                user4.address,
            ];
            const claimableTimestamps = [
                Date.now() + 1000,
                Date.now() + 2000,
                Date.now() + 3000,
                Date.now() + 4000,
            ];
            const claimAmounts = [
                ethers.parseUnits("1000", 6),
                ethers.parseUnits("2000", 6),
                ethers.parseUnits("3000", 6),
                ethers.parseUnits("4000", 6),
            ];

            const [accessKeys, typedData] =
                await Fixtures.createClaimDataMultiple(
                    domain,
                    claimers,
                    claimableTimestamps,
                    claimAmounts,
                );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
            );

            log({ accessKeys });
            log({ typedData });

            const signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
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
                .to.emit(stakingClaim, "ClaimDataCreated")
                .withArgs(
                    user1.address,
                    claimableTimestamps[0],
                    claimAmounts[0],
                    accessKeys[0],
                )
                .and.to.emit(stakingClaim, "ClaimDataCreated")
                .withArgs(
                    user2.address,
                    claimableTimestamps[1],
                    claimAmounts[1],
                    accessKeys[1],
                )
                .and.to.emit(stakingClaim, "ClaimDataCreated")
                .withArgs(
                    user3.address,
                    claimableTimestamps[2],
                    claimAmounts[2],
                    accessKeys[2],
                )
                .and.to.emit(stakingClaim, "ClaimDataCreated")
                .withArgs(
                    user4.address,
                    claimableTimestamps[3],
                    claimAmounts[3],
                    accessKeys[3],
                );
        });

        it("Should successfully create Claim Data for 100 users", async () => {
            const [claimers, claimableTimestamps, claimAmounts] =
                Fixtures.generateClaimData(100);

            const [accessKeys, typedData] =
                await Fixtures.createClaimDataMultiple(
                    domain,
                    claimers,
                    claimableTimestamps,
                    claimAmounts,
                );

            typedData.message.nonce = await stakingClaim.getNonce(
                typedData.message.selector,
            );

            log({ accessKeys });
            log({ typedData });

            const signatures = await Helper.signTypedDataMultiple(typedData, [
                firstOwner,
                secondOwner,
                thirdOwner,
            ]);

            const combinedSignatures = ethers.concat(signatures);

            let txn = await stakingClaim
                .connect(firstOwner)
                .execute(
                    typedData.message.selector,
                    typedData.message.inputData,
                    combinedSignatures,
                );

            await txn.wait();

            const events = await stakingClaim.queryFilter(
                "ClaimDataCreated",
                txn.blockNumber,
                txn.blockNumber,
            );

            expect(events.length).to.equal(100);
        });
    });
});
