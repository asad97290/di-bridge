// 0x4f9EFD531668930FB044E3E59a21Cc5b18412C33 --> eth - fantom

// 0xcd669AC5A3eF02A35826aaa7FC4562aa2738B289 --> avax - weth

//0x000Dc5657D350184aD3CbCC788A26d734371A65D --> avax bridge

import Web3 from "web3"
import BridgeBsc from "../abi/BridgeBsc.json" assert { type: "json" };

let avaxWeb3 = new Web3("https://avalanche-fuji.infura.io/v3/dd5214a068f644fe84f38f6f29e64b0a")

let userAddress = "0x154ab77D6560A12955376cb66cF3fceeC7F973E4"
let userPrivateKey = "0x9809a34834a64865a2f76c49a4fd362d9610ce19056e908264bbf6475ac00b18"

let admin1Address = "0x67dC7E8DDb74347bF0802692c2Cd1705D87F00c8"
let admin1PrivateKey = "0xe06e5bd9811eeab66765ae98a4181798b7262fb4feffdedf4e6f5c09c653015c"

let admin2Address = "0x6A393b6e432c068664bc5C2341309d1FEfF244D1"
let admin2PrivateKey = "0x0809d3f9a78c7f81e7656b45d311b326a931bd51de607d3aff8eab5e9940cf48"

var newAccount = avaxWeb3.eth.accounts.privateKeyToAccount(userPrivateKey);
avaxWeb3.eth.accounts.wallet.add(newAccount);
avaxWeb3.eth.defaultAccount = userAddress;


let Birdge1 = new avaxWeb3.eth.Contract(BridgeBsc.abi,BridgeBsc.address)
const amount = avaxWeb3.utils.toWei("0.001","ether");
let nonce = Math.floor(1+Math.random()*1000);
const message = avaxWeb3.utils.soliditySha3(

  {t: 'address', v: "0x67dC7E8DDb74347bF0802692c2Cd1705D87F00c8"},
  {t: 'address', v: userAddress},
  {t: 'uint256', v: amount},
  {t: 'uint256', v: nonce},
).toString('hex');
const { signature } = avaxWeb3.eth.accounts.sign(
  message, 
  userPrivateKey
); 

(async function(){

    console.log("amount",amount)
    avaxWeb3.eth.sendTransaction(
        {
            from:userAddress,
            to:BridgeBsc.address,
            gas:"210000",
            data:Birdge1.methods.burn(amount,nonce, signature).encodeABI()
        })
    .on("transactionHash",(tx)=>{
    console.log("tx ",tx)
    })
    .on("receipt",(receipt)=>{
        
        console.log("receipt ",receipt)
    })
    })()