# decentralize bridge

This project demonstrates a prototype for a decentralize bridge

Try running some of the following tasks:
add .env file to your project root and then run following commands
```shell
nvm use 20
npm i
npx hardhat compile
npx hardhat test ./test/diBridge.js
node backend-scripts/eventListenerPoly.js 
node backend-scripts/eventListenerAvax.js 
node backend-scripts/lock.mjs
node backend-scripts/redeem.mjs 
```
