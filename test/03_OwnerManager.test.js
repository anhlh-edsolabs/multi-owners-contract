require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
const ethers = require("ethers");
const hre = require("hardhat");
const { log } = require("console");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Owner Manager", () => {
    async function deployContract() {
        const [deployer, firstOwner, secondOwner, thirdOWner] =
            await hre.ethers.getSigners();

        const OwnerManagerFactory =
            await hre.ethers.getContractFactory("OwnerManager");
        const ownerManagerContract = await hre.upgrades.deployProxy(
            OwnerManagerFactory,
            [
                deployer.address,
                firstOwner.address,
                secondOwner.address,
                thirdOWner.address,
            ],
        );

        await ownerManagerContract.waitForDeployment();

        return {
            deployer,
            firstOwner,
            secondOwner,
            thirdOWner,
            ownerManagerContract,
        };
    }
    
    describe("Change Owner", () => {
        it("Change owner using Index marker", async () => {
            const {
                deployer,
                firstOwner,
                secondOwner,
                thirdOWner,
                ownerManagerContract,
            } = await loadFixture(deployContract);

            const newOwner = ethers.Wallet.createRandom();

            await expect(
                ownerManagerContract
                    .connect(firstOwner)
                    .changeOwnerWithIndexMarker(
                        firstOwner.address,
                        newOwner.address,
                    ),
            )
                .to.emit(ownerManagerContract, "OwnerChanged")
                .withArgs(firstOwner.address, newOwner.address);
        });

        it("Change owner using Array iteration", async () => {
            const {
                deployer,
                firstOwner,
                secondOwner,
                thirdOWner,
                ownerManagerContract,
            } = await loadFixture(deployContract);

            const newOwner = ethers.Wallet.createRandom();

            await expect(
                ownerManagerContract
                    .connect(firstOwner)
                    .changeOwnerWithArrayIteration(
                        firstOwner.address,
                        newOwner.address,
                    ),
            )
                .to.emit(ownerManagerContract, "OwnerChanged")
                .withArgs(firstOwner.address, newOwner.address);
        });

        it("Change owner using Index mapping", async () => {
            const {
                deployer,
                firstOwner,
                secondOwner,
                thirdOWner,
                ownerManagerContract,
            } = await loadFixture(deployContract);

            const newOwner = ethers.Wallet.createRandom();

            await expect(
                ownerManagerContract
                    .connect(firstOwner)
                    .changeOwnerWithIndexMapping(
                        firstOwner.address,
                        newOwner.address,
                    ),
            )
                .to.emit(ownerManagerContract, "OwnerChanged")
                .withArgs(firstOwner.address, newOwner.address);
        });
    });
});
