import { ethers, waffle } from "hardhat"
import { BigNumber, BigNumberish } from "ethers"

export const tokenID1 = 1
export const tokenID2 = 2
export const tokenID3 = 3

export function eth(num: BigNumberish): BigNumber {
    return ethers.utils.parseEther(num)
}
