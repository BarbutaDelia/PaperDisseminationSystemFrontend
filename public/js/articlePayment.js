
const forwarderOrigin = 'http://localhost:6789';
import { contractAddress, contractAbi } from './config.js';

function addAlert(message) {
  document.getElementById('alert-container').innerHTML = '' +
    '<div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">' +
    '<strong>' + message + '</strong> ' +
    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button> ' +
    '</div> ' +
    '';
}

const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};
if (!isMetaMaskInstalled()) {
  addAlert("Please install the metamask extension!");
  const onboarding = new MetaMaskOnboarding({ forwarderOrigin });
  onboarding.startOnboarding();
}
else {
  const articleId = document.getElementById('articleId').value;
  const provider = window.ethereum;
  const web3 = new Web3(provider);

  // const contractAddress = '0x64707Dc09A2365f528b7AC886b5D2b3592322C02';
  // const contractABI = JSON.parse('[ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "articleId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "ArticlePaid", "type": "event" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "articlePayments", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "articleId", "type": "uint256" } ], "name": "payForArticle", "outputs": [], "stateMutability": "payable", "type": "function" } ]');
  const contract = new web3.eth.Contract(contractAbi, contractAddress);
  callContractMethod();

  async function callContractMethod() {
    try {
      await ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error(error);
    }

    const accounts = await web3.eth.getAccounts();

    try {
      const gasLimit = await contract.methods.payForArticle(articleId).estimateGas({
        from: accounts[0],
        value: web3.utils.toWei("0.01", "ether")
      });

      const result = await contract.methods.payForArticle(articleId).send({
        from: accounts[0],
        gas: gasLimit,
        value: web3.utils.toWei("0.01", "ether")
      });

    }
    catch (error) {
      console.log(error);
      if (error.message.includes("denied transaction signature")) {
        addAlert("In order for the article to be added, you must accept the transaction!")
      }
    }
  }
}
