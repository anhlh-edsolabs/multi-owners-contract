## Methods
| **Symbol** | **Meaning**                                                                              |
| :--------: | :--------------------------------------------------------------------------------------- |
|    **◯**   | Execution gas for this method does not include intrinsic gas overhead                    |
|    **△**   | Cost was non-zero but below the precision setting for the currency display (see options) |

|                                                         |    Min |       Max |       Avg | Calls | usd avg |
| :------------------------------------------------------ | -----: | --------: | --------: | ----: | ------: |
| **OwnerManager**                                        |        |           |           |       |         |
|        *changeOwnerWithArrayIteration(address,address)* |      - |         - |    37,600 |     2 | 0.29563 |
|        *changeOwnerWithIndexMapping(address,address)*   |      - |         - |    41,605 |     2 | 0.32712 |
|        *changeOwnerWithIndexMarker(address,address)*    |      - |         - |    37,101 |     2 | 0.29171 |
| **SignatureExtraction**                                 |        |           |           |       |         |
|        *extractSignatures(bytes)*                       |      - |         - |    35,296 |     2 | 0.27752 |
|        *extractSignatures1(bytes)*                      |      - |         - |    34,974 |     2 | 0.27498 |
|        *extractSignatures2(bytes)*                      |      - |         - |    36,472 |     2 | 0.28676 |
|        *extractSignatures3(bytes)*                      |      - |         - |   116,240 |     2 | 0.91394 |
| **StakingClaim**                                        |        |           |           |       |         |
|        *execute(bytes4,bytes,bytes)*                    | 90,350 | 7,441,372 | 1,194,937 |    16 | 9.39525 |

## Deployments
|                         | Min | Max  |       Avg | Block % |  usd avg |
| :---------------------- | --: | ---: | --------: | ------: | -------: |
| **MockToken**           |   - |    - | 1,187,173 |     4 % |  9.33421 |
| **OwnerManager**        |   - |    - | 1,399,114 |   4.7 % | 11.00060 |
| **SignatureExtraction** |   - |    - |   588,896 |     2 % |  4.63022 |
| **StakingClaim**        |   - |    - | 2,409,562 |     8 % | 18.94530 |

## Solidity and Network Config
| **Settings**        | **Value**       |
| ------------------- | --------------- |
| Solidity: version   | 0.8.20          |
| Solidity: optimized | true            |
| Solidity: runs      | 200             |
| Solidity: viaIR     | false           |
| Block Limit         | 30,000,000      |
| L1 Gas Price        | 3 gwei          |
| Token Price         | 2620.85 usd/eth |
| Network             | ETHEREUM        |
| Toolchain           | hardhat         |

