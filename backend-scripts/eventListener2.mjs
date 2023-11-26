const Web3 = require("web3");
const BridgeEth =require("./BridgeBsc.json")
let avaxWeb3 = new Web3("https://polygon-mumbai.infura.io/v3/9dacfd2750074b6fb82003cc187e06c4")
let admin2Address = "0x67dC7E8DDb74347bF0802692c2Cd1705D87F00c8"
let admin2PrivateKey = "0xe06e5bd9811eeab66765ae98a4181798b7262fb4feffdedf4e6f5c09c653015c"

var newAccount = avaxWeb3.eth.accounts.privateKeyToAccount(admin2PrivateKey);
avaxWeb3.eth.accounts.wallet.add(newAccount);
avaxWeb3.eth.defaultAccount = admin2Address;

let Birdge1 = new avaxWeb3.eth.Contract(BridgeEth.abi,BridgeEth.address)



class EventListener {
  web3ws;
  web3;
  subscription;

  constructor(wss, https) {
    this.web3ws = new Web3(new Web3.providers.WebsocketProvider(wss));
    this.web3 = new Web3(new Web3.providers.HttpProvider(https));
  }

  subscribe(contractAddress) {
    try {
      this.subscription = this.web3ws.eth.subscribe(
        "logs",
        {
          address: contractAddress,
        },
        (err, res) => {
          if (err) console.error(err);
        }
      );
    } catch (err) {
      console.log("subscribe Error", err);
    }
  }

  listenEvents() {
    try {
      console.log("Listening Events...");
      this.subscription.on("data", async(data) => {
        console.log("data", data);
        let receipt = await this.web3.eth.getTransactionReceipt(data.transactionHash);
        let transferParams = this.web3.eth.abi.decodeLog([
          {
            "indexed": false,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "date",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          },
          {
            "indexed": true,
            "internalType": "enum BridgeEth.Step",
            "name": "step",
            "type": "uint8"
          }
        ], receipt['logs'][1]['data'], receipt['logs'][1]['topics']);
        console.log(transferParams)

         await Birdge1.methods.unLock(
          admin2Address,
          transferParams.from,
          transferParams.amount,
          transferParams.nonce,
          transferParams.signature
        ).send({from:admin2Address,gas:"210000"})
        .on("transactionHash",(tx)=>{
console.log("tx",tx)
})
.on("receipt",(receipt)=>{
          console.log("receipt",receipt)
          
        })

      });
    } catch (err) {
      console.log(err);
    }
  }
}
function init() {
  let txChecker = new EventListener(
      "wss://api.avax-test.network/ext/bc/C/ws",
      "https://api.avax-test.network/ext/bc/C/rpc"
  );
  txChecker.subscribe(
    "0x000Dc5657D350184aD3CbCC788A26d734371A65D"
  );
  txChecker.listenEvents();
}

init();
