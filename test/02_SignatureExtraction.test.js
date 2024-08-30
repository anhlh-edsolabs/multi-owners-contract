require("dotenv").config();
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Signature Extraction", () => {
    async function deployContract() {
        const [deployer] = await hre.ethers.getSigners();

        const SignatureExtractionFactory = await hre.ethers.getContractFactory(
            "SignatureExtraction",
        );
        const signatureExtractionContract =
            await SignatureExtractionFactory.deploy();

        await signatureExtractionContract.waitForDeployment();

        return { deployer, signatureExtractionContract };
    }

    before(async () => {
        const { deployer, signatureExtractionContract } =
            await deployContract();
        this.deployer = deployer;
        this.signatureExtraction = signatureExtractionContract;
    });

    describe("Extract signatures", () => {
        it("Extract all signatures v0", async () => {
            const combinedSignatures =
                "0x548326630524311d1cf3c618f20b25d3a2b6d9d5b59d00f4f70741d5de8e2ef9034e6dadc82a357038bebee3afab9ed0d0f0c08248f48b33a17393566f7328af1bb9bcea58c04133ce374d5f196b4a4ea2b66cee875dcfac26668ecd61cb30474b2f1ea76bdb99be709c8f0130bfeacf695284d15eb2da61d6a71e8b165ad839aa1b89aee965f02a241dbae9c5f3368c51bb9923908417b5e67311c0d3602f99d90e47bb3e1e63c87d914497843813760edd0339f1d0756b360c3e8eede1a985a4821b";
            const signatures = [
                "0x548326630524311d1cf3c618f20b25d3a2b6d9d5b59d00f4f70741d5de8e2ef9034e6dadc82a357038bebee3afab9ed0d0f0c08248f48b33a17393566f7328af1b",
                "0xb9bcea58c04133ce374d5f196b4a4ea2b66cee875dcfac26668ecd61cb30474b2f1ea76bdb99be709c8f0130bfeacf695284d15eb2da61d6a71e8b165ad839aa1b",
                "0x89aee965f02a241dbae9c5f3368c51bb9923908417b5e67311c0d3602f99d90e47bb3e1e63c87d914497843813760edd0339f1d0756b360c3e8eede1a985a4821b",
            ];

            await expect(
                this.signatureExtraction.extractSignatures(combinedSignatures),
            )
                .to.emit(this.signatureExtraction, "SigChecked")
                .withArgs(signatures);
        });

        it("Extract all signatures v1", async () => {
            const combinedSignatures =
                "0x548326630524311d1cf3c618f20b25d3a2b6d9d5b59d00f4f70741d5de8e2ef9034e6dadc82a357038bebee3afab9ed0d0f0c08248f48b33a17393566f7328af1bb9bcea58c04133ce374d5f196b4a4ea2b66cee875dcfac26668ecd61cb30474b2f1ea76bdb99be709c8f0130bfeacf695284d15eb2da61d6a71e8b165ad839aa1b89aee965f02a241dbae9c5f3368c51bb9923908417b5e67311c0d3602f99d90e47bb3e1e63c87d914497843813760edd0339f1d0756b360c3e8eede1a985a4821b";
            const signatures = [
                "0x548326630524311d1cf3c618f20b25d3a2b6d9d5b59d00f4f70741d5de8e2ef9034e6dadc82a357038bebee3afab9ed0d0f0c08248f48b33a17393566f7328af1b",
                "0xb9bcea58c04133ce374d5f196b4a4ea2b66cee875dcfac26668ecd61cb30474b2f1ea76bdb99be709c8f0130bfeacf695284d15eb2da61d6a71e8b165ad839aa1b",
                "0x89aee965f02a241dbae9c5f3368c51bb9923908417b5e67311c0d3602f99d90e47bb3e1e63c87d914497843813760edd0339f1d0756b360c3e8eede1a985a4821b",
            ];

            await expect(
                this.signatureExtraction.extractSignatures1(combinedSignatures),
            )
                .to.emit(this.signatureExtraction, "SigChecked")
                .withArgs(signatures);
        });

        it("Extract all signatures v2", async () => {
            const combinedSignatures =
                "0x548326630524311d1cf3c618f20b25d3a2b6d9d5b59d00f4f70741d5de8e2ef9034e6dadc82a357038bebee3afab9ed0d0f0c08248f48b33a17393566f7328af1bb9bcea58c04133ce374d5f196b4a4ea2b66cee875dcfac26668ecd61cb30474b2f1ea76bdb99be709c8f0130bfeacf695284d15eb2da61d6a71e8b165ad839aa1b89aee965f02a241dbae9c5f3368c51bb9923908417b5e67311c0d3602f99d90e47bb3e1e63c87d914497843813760edd0339f1d0756b360c3e8eede1a985a4821b";
            const signatures = [
                "0x548326630524311d1cf3c618f20b25d3a2b6d9d5b59d00f4f70741d5de8e2ef9034e6dadc82a357038bebee3afab9ed0d0f0c08248f48b33a17393566f7328af1b",
                "0xb9bcea58c04133ce374d5f196b4a4ea2b66cee875dcfac26668ecd61cb30474b2f1ea76bdb99be709c8f0130bfeacf695284d15eb2da61d6a71e8b165ad839aa1b",
                "0x89aee965f02a241dbae9c5f3368c51bb9923908417b5e67311c0d3602f99d90e47bb3e1e63c87d914497843813760edd0339f1d0756b360c3e8eede1a985a4821b",
            ];

            await expect(
                this.signatureExtraction.extractSignatures2(combinedSignatures),
            )
                .to.emit(this.signatureExtraction, "SigChecked")
                .withArgs(signatures);
        });

        it("Extract all signatures v3", async () => {
            const combinedSignatures =
                "0x548326630524311d1cf3c618f20b25d3a2b6d9d5b59d00f4f70741d5de8e2ef9034e6dadc82a357038bebee3afab9ed0d0f0c08248f48b33a17393566f7328af1bb9bcea58c04133ce374d5f196b4a4ea2b66cee875dcfac26668ecd61cb30474b2f1ea76bdb99be709c8f0130bfeacf695284d15eb2da61d6a71e8b165ad839aa1b89aee965f02a241dbae9c5f3368c51bb9923908417b5e67311c0d3602f99d90e47bb3e1e63c87d914497843813760edd0339f1d0756b360c3e8eede1a985a4821b";
            const signatures = [
                "0x548326630524311d1cf3c618f20b25d3a2b6d9d5b59d00f4f70741d5de8e2ef9034e6dadc82a357038bebee3afab9ed0d0f0c08248f48b33a17393566f7328af1b",
                "0xb9bcea58c04133ce374d5f196b4a4ea2b66cee875dcfac26668ecd61cb30474b2f1ea76bdb99be709c8f0130bfeacf695284d15eb2da61d6a71e8b165ad839aa1b",
                "0x89aee965f02a241dbae9c5f3368c51bb9923908417b5e67311c0d3602f99d90e47bb3e1e63c87d914497843813760edd0339f1d0756b360c3e8eede1a985a4821b",
            ];

            await expect(
                this.signatureExtraction.extractSignatures3(combinedSignatures),
            )
                .to.emit(this.signatureExtraction, "SigChecked")
                .withArgs(signatures);
        });
    });
});
