const Web3 = require("web3");
const {MongoClient} = require("mongodb");
const path = require("path");
const BridgeAvax = require("../abi/BridgeAvax.json");
const BridgePoly = require("../abi/BridgePoly.json");
require("dotenv").config({ path: path.resolve(__dirname,"../.env") }); 
let client = new MongoClient(
  process.env.DB_URL
  )

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
        let tx = await this.polyWeb3.eth.getTransaction(data.transactionHash);

        
        if(tx.input.substring(0, 10) == "0xd8f7c836"){
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
          .on("receipt", async(receipt) => {
            console.log("receipt", receipt);
            const BlockNumbers = client.db("gpt_chat").collection("blockNumbers");
            const Transactions = client.db("gpt_chat").collection("transactions");

            await BlockNumbers.updateOne({},{currnetBlockNumber:data.blockNumber})
            await Transactions.insertOne({transactionHash:data.transactionHash})

          });
        }
      });


    } catch (err) {
      console.log(err);
    }
  }
}
async function init() {
  try{
  if(!process.env.AVAX_WS_RPC || !process.env.AVAX_RPC || !process.env.POLY_WS_RPC || !process.env.POLY_RPC){
    throw new Error("please provide env")
  }
  let txChecker2 = new EventListener(
    process.env.AVAX_WS_RPC,
    process.env.AVAX_RPC,
    process.env.POLY_WS_RPC,
    process.env.POLY_RPC
  );
  txChecker2.subscribe(
    BridgeAvax,
    BridgePoly
  );
  txChecker2.listenEvents("mint");


  await client.connect()
  const Transactions = client.db("gpt_chat").collection("transactions");
  
  const BlockNumbers = client.db("gpt_chat").collection("blockNumbers");
  let blockNum = await BlockNumbers.findOne({})
  console.log(blockNum.currnetBlockNumber)

  let web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.POLY_WS_RPC));

   let contract = new web3.eth.Contract(
        BridgePoly.abi,
        BridgePoly.address
      );
  let events = await contract.getPastEvents("Transfer",{
    fromBlock: blockNum?.currnetBlockNumber || 0,
     toBlock: 'latest'
})
for(let event of events){
      console.log("event",event)
      let transaction = await Transactions.findOne({transactionHash:event.transactionHash})
      if(!transaction){
        // mint token tx
        /**
         
        let receipt = await this.polyWeb3.eth.getTransactionReceipt(
          transaction.transactionHash
        );
        let tx = await this.polyWeb3.eth.getTransaction(transaction.transactionHash);

        
        if(tx.input.substring(0, 10) == "0xd8f7c836"){
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
          .on("receipt", async(receipt) => {
            console.log("receipt", receipt);
            const BlockNumbers = client.db("gpt_chat").collection("blockNumbers");

            await BlockNumbers.updateOne({},{currnetBlockNumber:receipt.blockNumber})
            await Transactions.insertOne({transactionHash:data.transactionHash})

          });
         */
      }

    }
  }catch(err){
    console.log(err)
  }
}

init();
