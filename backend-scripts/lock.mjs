import Web3 from "web3";
import BridgePoly from "../abi/BridgePoly.json" assert { type: "json" };
import {} from 'dotenv/config'
if(!process.env.USER_ADDRESS || !process.env.USER_PK || !process.env.ADMIN_ADDRESS || !process.env.POLY_RPC){
  throw new Error("please provide env")
}
let polyWeb3 = new Web3(process.env.POLY_RPC);
let userAddress = process.env.USER_ADDRESS;
let userPrivateKey = process.env.USER_PK;

var newAccount = polyWeb3.eth.accounts.privateKeyToAccount(userPrivateKey);
polyWeb3.eth.accounts.wallet.add(newAccount);
polyWeb3.eth.defaultAccount = userAddress;

let BridgePolyObj = new polyWeb3.eth.Contract(BridgePoly.abi, BridgePoly.address);

let nonce = Math.floor(1 + Math.random() * 1000);
const amount = polyWeb3.utils.toWei("0.01", "ether");
const message = polyWeb3.utils
  .soliditySha3(
    { t: "address", v: process.env.ADMIN_ADDRESS },
    { t: "address", v: userAddress },
    { t: "uint256", v: amount },
    { t: "uint256", v: nonce }
  )
  .toString("hex");
const { signature } = polyWeb3.eth.accounts.sign(message, userPrivateKey);

(async function () {
  polyWeb3.eth
    .sendTransaction({
      from: userAddress,
      to: BridgePoly.address,
      value: amount,
      gas: await BridgePolyObj.methods
        .lock(nonce, signature)
        .estimateGas({ from: userAddress, value: amount }),
      data: BridgePolyObj.methods.lock(nonce, signature).encodeABI(),
    })
    .on("transactionHash", (tx) => {
      console.log("tx ", tx);
    })
    .on("receipt", (receipt) => {
      console.log("receipt ", receipt);
    });
})();
