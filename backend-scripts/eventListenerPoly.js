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
  contract1Obj;
  admin2Address;

  constructor(avaxWss, avaxHttps,polyWss, polyHttps) {
    this.avaxWeb3ws = new Web3(new Web3.providers.WebsocketProvider(avaxWss));
    this.avaxWeb3 = new Web3(new Web3.providers.HttpProvider(avaxHttps));

    this.polyWeb3ws = new Web3(new Web3.providers.WebsocketProvider(polyWss));
    this.polyWeb3 = new Web3(new Web3.providers.HttpProvider(polyHttps));
    this.admin2Address = process.env.ADMIN_ADDRESS;
    let admin2PrivateKey = process.env.ADMIN_PK;

    let newAccount =
      this.avaxWeb3.eth.accounts.privateKeyToAccount(admin2PrivateKey);
    this.avaxWeb3.eth.accounts.wallet.add(newAccount);
    this.avaxWeb3.eth.defaultAccount = this.admin2Address;

  }

  subscribe(contract1, contract2) {
    try {
      this.contract1Obj = new this.avaxWeb3.eth.Contract(
        contract1.abi,
        contract1.address
      );
   

      console.log("contract2.address",contract2.address)
      this.subscription = this.polyWeb3ws.eth.subscribe(
        "logs",
        {
          address: contract2.address,
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
        let receipt = await this.polyWeb3.eth.getTransactionReceipt(
          data.transactionHash
        );
        let transferInputs = BridgeAvax.abi.filter(({ name }) => name === 'Transfer')[0]['inputs'];

        let transferParams = this.polyWeb3.eth.abi.decodeLog(
          transferInputs,
          receipt["logs"][1]["data"],
          receipt["logs"][1]["topics"]
        );
        console.log("fnName",fnName)
        let method = await this.contract1Obj["methods"][fnName](
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
  if(!process.env.AVAX_WS_RPC || !process.env.AVAX_RPC || !process.env.POLY_WS_RPC || !process.env.POLY_RPC){
    throw new Error("please provide env")
  }
  let txChecker1 = new EventListener(
    process.env.AVAX_WS_RPC,
    process.env.AVAX_RPC,
    process.env.POLY_WS_RPC,
    process.env.POLY_RPC
  );
  txChecker1.subscribe(
    BridgeAvax,
    BridgePoly
  );
  txChecker1.listenEvents("mint");

}

init();
