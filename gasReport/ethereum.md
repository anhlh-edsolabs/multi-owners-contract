## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                    | Min | Max |     Avg | Calls | usd avg |
| :--------------------------------- | --: | --: | ------: | ----: | ------: |
| **SignatureExtraction**            |     |     |         |       |         |
|        *extractSignatures(bytes)*  |   - |   - |  35,296 |     2 | 0.27020 |
|        *extractSignatures1(bytes)* |   - |   - |  34,974 |     2 | 0.26773 |
|        *extractSignatures2(bytes)* |   - |   - |  36,472 |     2 | 0.27920 |
|        *extractSignatures3(bytes)* |   - |   - | 116,240 |     2 | 0.88985 |

## Deployments
|                         | Min | Max  |     Avg | Block % | usd avg |
| :---------------------- | --: | ---: | ------: | ------: | ------: |
| **SignatureExtraction** |   - |    - | 588,908 |     2 % | 4.50824 |

## Solidity and Network Config
| **Settings**        | **Value**       |
| ------------------- | --------------- |
| Solidity: version   | 0.8.20          |
| Solidity: optimized | true            |
| Solidity: runs      | 200             |
| Solidity: viaIR     | false           |
| Block Limit         | 30,000,000      |
| L1 Gas Price        | 3 gwei          |
| Token Price         | 2551.75 usd/eth |
| Network             | ETHEREUM        |
| Toolchain           | hardhat         |

