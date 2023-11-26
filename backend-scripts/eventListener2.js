const Web3 = require("web3");
const BridgeAvax = require("../abi/BridgeAvax.json");
const BridgePoly = require("../abi/BridgePoly.json");
require("dotenv").config({ path: "../.env" });
class EventListener {
  avaxWeb3ws;
  avaxWeb3;
  polyWeb3ws;
  polyWeb3;
  subscription;
  contract2Obj;
  admin2Address;

  constructor(avaxWss, avaxHttps,polyWss, polyHttps) {
    this.avaxWeb3ws = new Web3(new Web3.providers.WebsocketProvider(avaxWss));
    this.avaxWeb3 = new Web3(new Web3.providers.HttpProvider(avaxHttps));
    
    this.polyWeb3ws = new Web3(new Web3.providers.WebsocketProvider(polyWss));
    this.polyWeb3 = new Web3(new Web3.providers.HttpProvider(polyHttps));
    this.admin2Address = process.env.ADMIN_ADDRESS;
    let admin2PrivateKey = process.env.ADMIN_PK;

    // let newAccount =
    //   this.avaxWeb3.eth.accounts.privateKeyToAccount(admin2PrivateKey);
    // this.avaxWeb3.eth.accounts.wallet.add(newAccount);
    // this.avaxWeb3.eth.defaultAccount = this.admin2Address;

    let newAccount1 =
    this.polyWeb3.eth.accounts.privateKeyToAccount(admin2PrivateKey);
  this.polyWeb3.eth.accounts.wallet.add(newAccount1);
  this.polyWeb3.eth.defaultAccount = this.admin2Address;
  }

  subscribe(contract1, contract2) {
    try {
    
      this.contract2Obj = new this.polyWeb3.eth.Contract(
        contract2.abi,
        contract2.address
      );

      this.subscription = this.avaxWeb3ws.eth.subscribe(
        "logs",
        {
          address: contract1.address,
        },
        (err, res) => {
          if (err) console.error(err);
        }
      );
   
    } catch (err) {
      console.log("subscribe Error", err);
    }
  }

  listenEvents(fnName) {
    try {
      console.log("Listening Events...");

      this.subscription.on("data", async (data) => {
        let receipt = await this.avaxWeb3.eth.getTransactionReceipt(
          data.transactionHash
        );
        let transferParams = this.avaxWeb3.eth.abi.decodeLog(
          [
            {
              indexed: false,
              internalType: "address",
              name: "from",
              type: "address",
            },
            {
              indexed: false,
              internalType: "address",
              name: "to",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "date",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "nonce",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "bytes",
              name: "signature",
              type: "bytes",
            },
            {
              indexed: true,
              internalType: "enum BridgeEth.Step",
              name: "step",
              type: "uint8",
            },
          ],
          receipt["logs"][1]["data"],
          receipt["logs"][1]["topics"]
        );
        console.log("fnName",fnName)
        let method = await this.contract2Obj["methods"][fnName](
          this.admin2Address,
          transferParams.from,
          transferParams.amount,
          transferParams.nonce,
          transferParams.signature
        );
        let gas = await method.estimateGas({ from: this.admin2Address });
        await method
          .send({ from: this.admin2Address, gas })
          .on("transactionHash", (tx) => {
            console.log("tx", tx);
          })
          .on("receipt", (receipt) => {
            console.log("receipt", receipt);
          });
      });


    } catch (err) {
      console.log(err);
    }
  }
}
function init() {
  /**
   * Event listener for Polygon
   */
  let txChecker1 = new EventListener(
    "wss://api.avax-test.network/ext/bc/C/ws",
    "https://api.avax-test.network/ext/bc/C/rpc",
    "wss://polygon-mumbai.infura.io/ws/v3/9dacfd2750074b6fb82003cc187e06c4",
    "https://polygon-mumbai.infura.io/v3/9dacfd2750074b6fb82003cc187e06c4"
  );
  txChecker1.subscribe(
    BridgeAvax,
    BridgePoly
  );
  txChecker1.listenEvents("unLock");

  /**
   * Event listener for Avalanche
   */

 
  // txChecker1.listenEvents("unLock");
}

init();
