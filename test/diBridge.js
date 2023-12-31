const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { expect } = require("chai");
  
  describe("DiBridge", function () {
    async function deployDiBridgeFixture() {
  
  
      const [owner, otherAccount] = await ethers.getSigners();
  
      const TokenBase = await ethers.getContractFactory("WrappedToken");
      const BridgeEth = await ethers.getContractFactory("BridgePoly");
      const BridgeBsc = await ethers.getContractFactory("BridgeAvax");

      const tokenBase = await TokenBase.deploy("Wrapped ETH","WETH")
      const bridgeEth = await BridgeEth.deploy()
      const bridgeBsc = await BridgeBsc.deploy(tokenBase.address)
      return { tokenBase, bridgeEth, bridgeBsc, owner, otherAccount };
    }
  
    describe("Deployment", function () {
      it("Should test complete scenario", async function () {
        const { tokenBase, bridgeEth, bridgeBsc, owner, otherAccount } = await loadFixture(deployDiBridgeFixture);
        let nonce = Math.floor(1+Math.random()*1000)
        let amountInEth = 1
        const amountInWei = ethers.utils.parseUnits(amountInEth.toString(), 'ether');
        
        const message = ethers.utils.solidityKeccak256(
            ['address', 'address', 'uint256', 'uint256'],
            [owner.address ,otherAccount.address, amountInWei,nonce]
          );
        const signature = await otherAccount.signMessage(ethers.utils.arrayify(message));
        
        await bridgeEth.connect(otherAccount).lock(nonce,signature,{value:amountInWei})
    
        expect(await tokenBase.balanceOf(otherAccount.address)).to.equal("0");
        // const transferFilter = bridgeEth.filters.Transfer();
        
        // bridgeEth.on(transferFilter,  async (from, to, value, time,nonce,signature) => {
            // console.log('Transfer Event:', { from, to, value, time,nonce,signature });
            let tx = await bridgeBsc.mint(owner.address ,otherAccount.address, amountInWei,nonce,signature)
            await tx.wait() 

        // });
        
        // let sleep = async()=>new Promise((r)=>setTimeout(r, 20000))
        // await sleep()
        expect(await tokenBase.balanceOf(otherAccount.address)).to.equal("1000000000000000000");




        let tx1 = await bridgeBsc.connect(otherAccount).burn(amountInWei,nonce,signature)
            await tx1.wait()


            nonce = Math.floor(1+Math.random()*1000)

            const message1 = ethers.utils.solidityKeccak256(
                ['address', 'address', 'uint256', 'uint256'],
                [owner.address ,otherAccount.address, amountInWei,nonce]
              );
            const signature1 = await otherAccount.signMessage(ethers.utils.arrayify(message1));
            
            let tx2 = await bridgeEth.unLock(owner.address ,otherAccount.address, amountInWei,nonce,signature1)



            expect(await tokenBase.balanceOf(otherAccount.address)).to.equal("0");

      });
  
    });
  
  });
  