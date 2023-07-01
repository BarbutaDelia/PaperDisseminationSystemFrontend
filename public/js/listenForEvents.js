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

const provider = window.ethereum;
const web3 = new Web3(provider);
const contract = new web3.eth.Contract(contractAbi, contractAddress);
const accounts = await web3.eth.getAccounts();
const currentUserAddress = accounts[0];
// listen for the ArticlePaid event
contract.events.ArticlePaid()
  .on('data', event => {
    const userAddress = event.returnValues.userAddress;
    if (userAddress === currentUserAddress) { // Compare with the current user's Ethereum address
      addAlert("Your payment has been processed. The article is now accessible for reviews!");
    }
  })
  .on('error', error => {
    console.error(error);
  });


const NFTcontract = new web3.eth.Contract(NFTcontractAbi, NFTcontractAddress);

// listen for the NFTMinted event
NFTcontract.events.NFTMinted()
  .on('data', event => {
    const userAddress = event.returnValues.owner;
    if (userAddress === currentUserAddress){
      addAlert("Congratulations! The NFT has been successfully transferred into your wallet. Happy reviewing!");
    }
  })
  .on('error', error => {
    console.error(error);
  });
