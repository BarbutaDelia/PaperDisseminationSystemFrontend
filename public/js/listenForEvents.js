import { contractAddress, contractAbi } from './config.js';
import { NFTcontractAddress, NFTcontractAbi } from './config.js';


function addAlert(message) {
  document.getElementById('alert-container').innerHTML = '' +
    '<div class="alert alert-success alert-dismissible fade show mb-0" role="alert">' +
    '<strong>' + message + '</strong> ' +
    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button> ' +
    '</div> ' +
    '';
}

// const contractAddress = '0x64707Dc09A2365f528b7AC886b5D2b3592322C02';
// const contractAbi = JSON.parse('[ { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "uint256", "name": "articleId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "ArticlePaid", "type": "event" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "articlePayments", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "articleId", "type": "uint256" } ], "name": "payForArticle", "outputs": [], "stateMutability": "payable", "type": "function" } ]');
const provider = window.ethereum;
const web3 = new Web3(provider);
const contract = new web3.eth.Contract(contractAbi, contractAddress);

// listen for the ArticlePaid event
contract.events.ArticlePaid()
  .on('data', event => {
    // const articleId = event.returnValues.articleId;
    // const amount = web3.utils.fromWei(event.returnValues.amount, 'ether');
    addAlert("Your payment has been processed. The article is now accesible for reviews! ")
  })
  .on('error', error => {
    console.error(error);
  });


const NFTcontract = new web3.eth.Contract(NFTcontractAbi, NFTcontractAddress);

// listen for the NFTMinted event
NFTcontract.events.NFTMinted()
  .on('data', event => {
    addAlert("Congratulations! The NFT has been successfully transferred into your wallet. Happy reviewing!")
  })
  .on('error', error => {
    console.error(error);
  });
