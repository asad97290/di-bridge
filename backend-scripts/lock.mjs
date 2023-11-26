import Web3 from "web3"
import BridgeEth from "../abi/BridgeEth.json" assert { type: "json" };

let fantomtomWeb3 = new Web3("https://polygon-mumbai.infura.io/v3/9dacfd2750074b6fb82003cc187e06c4")

let userAddress = "0x154ab77D6560A12955376cb66cF3fceeC7F973E4"
let userPrivateKey = "0x9809a34834a64865a2f76c49a4fd362d9610ce19056e908264bbf6475ac00b18"



var newAccount = fantomtomWeb3.eth.accounts.privateKeyToAccount(userPrivateKey);
fantomtomWeb3.eth.accounts.wallet.add(newAccount);
fantomtomWeb3.eth.defaultAccount = userAddress;


let Birdge1 = new fantomtomWeb3.eth.Contract(BridgeEth.abi,BridgeEth.address)



let nonce = Math.floor(1+Math.random()*1000)
const amount = fantomtomWeb3.utils.toWei("0.01","ether");
const message = fantomtomWeb3.utils.soliditySha3(

  {t: 'address', v: "0x6A393b6e432c068664bc5C2341309d1FEfF244D1"},
  {t: 'address', v: userAddress},
  {t: 'uint256', v: amount},
  {t: 'uint256', v: nonce},
).toString('hex');
const { signature } = fantomtomWeb3.eth.accounts.sign(
  message, 
  userPrivateKey
); 

(async function(){

console.log("amount",amount)
    fantomtomWeb3.eth.sendTransaction(
    {
        from:userAddress,
        to:BridgeEth.address,
        value:amount,
        gas:"210000",
        data:Birdge1.methods.lock(nonce, signature).encodeABI()
    })
.on("transactionHash",(tx)=>{
console.log("tx ",tx)
})
.on("receipt",(receipt)=>{
    
    console.log("receipt ",receipt)
})
})()