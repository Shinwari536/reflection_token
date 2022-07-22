import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";


describe("DeAiC Token", function () {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let investor: SignerWithAddress;
  let tokenInstance: Contract;
  let router: Contract;

  before(async () => {
    [owner,user,investor] = await ethers.getSigners();

    hre.tracer.nameTags[owner.address] = "ADMIN";

    const Router = await ethers.getContractFactory("UniswapV2Router02",owner)
    router = await Router.deploy(
      "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f",
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    )
    const Token = await ethers.getContractFactory("DeAiC", owner);

    tokenInstance = await Token.deploy(router.address);
    hre.tracer.nameTags[user.address] = "USER";
    hre.tracer.nameTags[owner.address] = "ADMIN";
    hre.tracer.nameTags[investor.address] = "INVESTOR";
    hre.tracer.nameTags[tokenInstance.address] = "DeAiC";
  });

  describe("Deoployement", function(){
    it("Should deploye the DeAiC contract correctly",async () => {

      expect(await tokenInstance.name()).to.equal("DeAiC");
      expect(await tokenInstance.symbol()).to.equal("DeAiC");
      expect(await tokenInstance.totalSupply()).to.equal(parseEther("1000000000"));
      
    })

    it("Check owner balance",async()=>{
      expect(await tokenInstance.callStatic.balanceOf(owner.address)).to.be.equal(parseEther("1000000000"))
    })

  })


  describe("Transfer", function(){
    it("Owner: Transfer Balance",async()=>{
      await expect(()=> tokenInstance.transfer(user.address,parseEther("1000"))).changeTokenBalance(tokenInstance,user,parseEther("1000"))
    })
  
    it("User: Transfer Balance",async()=>{
      await expect( tokenInstance.connect(user).transfer(investor.address,parseEther("1000")))
      .emit(tokenInstance,"Transfer")
      .withArgs(
        user.address,
        investor.address,
        parseEther("990")
      )
    })

    it("Router: if is transfering, sell from owner", async function() {
      // await expect(()=> tokenInstance.connect(router).transfer(user.address,parseEther("1000"))).changeTokenBalance(tokenInstance,user,parseEther("1000"))
      console.log("This one is remaining");
      
    })

    it("Revert transfering 0 amount",async () => {
      await expect(tokenInstance.transfer(investor.address, parseEther('0'))).to.be.revertedWith("Transfer amount must be greater than zero");
    })
  })

  describe("Checking exclusion", function(){
    it("Should exclude from Reward", async function(){
      await tokenInstance.excludeFromReward(user.address);
      expect(await tokenInstance.isExcludedFromReward(user.address)).to.be.equal(true);

    })

    it("Should include into Reward", async function(){
      await tokenInstance.includeInReward(user.address);
      expect(await tokenInstance.isExcludedFromReward(user.address)).to.be.equal(false);

    })

    it("Should exclude from Fees", async function(){
      await tokenInstance.excludeFromFee(user.address);
      expect(await tokenInstance.isExcludedFromFee(user.address)).to.be.equal(true);

    })

    it("Should include into Fees", async function(){
      await tokenInstance.excludeFromFee(user.address);
      await tokenInstance.includeInFee(user.address);
      expect(await tokenInstance.isExcludedFromFee(user.address)).to.be.equal(false);

    })



    it("Transfer: When no body is exclueded", async function(){
      await expect(()=> tokenInstance.transfer(user.address,parseEther("1000"))).changeTokenBalance(tokenInstance,user,parseEther("1000"))
      
    })

    it("Transfer: When sender is exclueded", async function(){
      await tokenInstance.excludeFromReward(user.address)
      await expect(()=> tokenInstance.connect(user).transfer(investor.address,parseEther("1000"))).
      changeTokenBalance(tokenInstance,user,parseEther("-1000"))
      
    })

    it("Transfer: When recipient is exclueded", async function(){
      await tokenInstance.excludeFromReward(investor.address)
      await expect(()=> tokenInstance.transfer(investor.address,
        parseEther("1000"))).
      changeTokenBalance(tokenInstance,investor,parseEther("1000"))
    })


    it("Transfer: When both (sender and recipient) are exclueded", async function(){
      // investor is excluded above (receiver)
      await tokenInstance.excludeFromReward(owner.address)

      await expect(()=> tokenInstance.transfer(investor.address,
        parseEther("1000"))).
      changeTokenBalance(tokenInstance,investor,parseEther("1000"))
    })

  })



  

  

});