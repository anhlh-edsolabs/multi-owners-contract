// const { ethers } = require("ethers");
// const hre = require("hardhat");
// const { log } = require("console");

const FunctionCallType = {
    FunctionCall: [
        { name: "nonce", type: "uint256" },
        { name: "selector", type: "bytes4" },
        { name: "inputData", type: "bytes" },
    ],
};

function getTypedData(domain, types, primaryType, message) {
    return {
        domain,
        types,
        primaryType,
        message,
    };
}

async function signTypedData(typedData, signer) {
    return await signer.signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message,
    );
}

async function signTypedDataMultiple(typedData, signers) {
    return Promise.all(
        signers.map((signer) =>
            signer.signTypedData(
                typedData.domain,
                typedData.types,
                typedData.message,
            ),
        ),
    );
}

module.exports = {
    Helper: {
        FunctionCallType,
        getTypedData,
        signTypedData,
        signTypedDataMultiple,
    },
};
