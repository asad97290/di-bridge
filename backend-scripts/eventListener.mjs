const Web3 = require("web3");
const BridgeEth =require("./BridgeBsc.json")
let avaxWeb3 = new Web3("https://avalanche-fuji.infura.io/v3/dd5214a068f644fe84f38f6f29e64b0a")
let admin2Address = "0x6A393b6e432c068664bc5C2341309d1FEfF244D1"
let admin2PrivateKey = "0x0809d3f9a78c7f81e7656b45d311b326a931bd51de607d3aff8eab5e9940cf48"

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

         await Birdge1.methods.mint(
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
    "wss://polygon-mumbai.infura.io/ws/v3/9dacfd2750074b6fb82003cc187e06c4",
    "https://polygon-mumbai.infura.io/v3/9dacfd2750074b6fb82003cc187e06c4"
  );
  txChecker.subscribe(
    "0x8F179A9A1fbe1c82ec96E5490B64cd4DA626d015"
  );
  txChecker.listenEvents();
}

init();
