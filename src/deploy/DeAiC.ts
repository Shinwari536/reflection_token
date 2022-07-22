import { Contract } from '@ethersproject/contracts'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const deployContract: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {

  let token: Contract;
  const signers = await hre.ethers.getSigners();

  const DeAiC = await hre.ethers.getContractFactory("DeAiC", signers[0])
  token = await DeAiC.deploy()

  console.log("DeAiC", token.address)

  try {
    await hre.run('verify', {
      address: token.address,
      constructorArgsParams: [],
    })
  } catch (error) {
    console.log(`Smart contract at address ${token.address} is already verified`)
  }


}

export default deployContract
