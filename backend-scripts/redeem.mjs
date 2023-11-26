import Web3 from "web3";
import BridgeAvax from "../abi/BridgeAvax.json" assert { type: "json" };
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
if(!process.env.USER_ADDRESS || !process.env.USER_PK || !process.env.ADMIN_ADDRESS || !process.env.AVAX_RPC){
  throw new Error("please provide env")
}
let avaxWeb3 = new Web3(process.env.AVAX_RPC);
let userAddress = process.env.USER_ADDRESS;
let userPrivateKey = process.env.USER_PK;

var newAccount = avaxWeb3.eth.accounts.privateKeyToAccount(userPrivateKey);
avaxWeb3.eth.accounts.wallet.add(newAccount);
avaxWeb3.eth.defaultAccount = userAddress;

let BridgeAvax = new avaxWeb3.eth.Contract(BridgeAvax.abi, BridgeAvax.address);
const amount = avaxWeb3.utils.toWei("0.001", "ether");
let nonce = Math.floor(1 + Math.random() * 1000);
const message = avaxWeb3.utils
  .soliditySha3(
    { t: "address", v: process.env.ADMIN_ADDRESS },
    { t: "address", v: userAddress },
    { t: "uint256", v: amount },
    { t: "uint256", v: nonce }
  )
  .toString("hex");
const { signature } = avaxWeb3.eth.accounts.sign(message, userPrivateKey);

(async function () {
  avaxWeb3.eth
    .sendTransaction({
      from: userAddress,
      to: BridgeAvax.address,
      gas: BridgeAvax.methods
        .burn(amount, nonce, signature)
        .estimateGas({ from: userAddress }),
      data: BridgeAvax.methods.burn(amount, nonce, signature).encodeABI(),
    })
    .on("transactionHash", (tx) => {
      console.log("tx ", tx);
    })
    .on("receipt", (receipt) => {
      console.log("receipt ", receipt);
    });
})();
