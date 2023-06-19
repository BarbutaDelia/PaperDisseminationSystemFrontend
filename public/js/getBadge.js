
const forwarderOrigin = 'http://localhost:6789';
const IPFS = 'ipfs://';
import { NFTcontractAddress, NFTcontractAbi } from './config.js';


function addAlert(message) {
    document.getElementById('alert-container').innerHTML = '' +
        '<div class="alert alert-danger alert-dismissible fade show mb-0" role="alert">' +
        '<strong>' + message + '</strong> ' +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button> ' +
        '</div> ' +
        '';
}

const CID = document.getElementById('CID').value;
if (CID != "") {

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
        const provider = window.ethereum;
        console.log(provider.selectedAddress);
        const web3 = new Web3(provider);
        const tokenURI = IPFS + CID;
        // console.log(tokenURI);
        const contract = new web3.eth.Contract(NFTcontractAbi, NFTcontractAddress);
        mintNFT();

        
        async function mintNFT() {
            // Request user to connect their selected Metamask account
            try {
              let response = await ethereum.request({ method: 'eth_requestAccounts' });
              console.log(response);
            } catch (error) {
              console.error(error);
            }
          
            // Get the currently connected account
            const accounts = await ethereum.request({ method: 'eth_accounts' });
          
            if (accounts.length === 0) {
              console.log("No account is connected");
              return;
            }
          
            const account = accounts[0]; // Use the connected account
            console.log(account);
          
            try {
              const gasLimit = await contract.methods.mintNFT(account, tokenURI).estimateGas({
                from: account
              });
          
              const result = await contract.methods.mintNFT(account, tokenURI).send({
                from: account,
                gas: gasLimit
              });
          
              console.log(result);
            } catch (error) {
              if (error.message.includes("denied transaction signature")) {
                addAlert("In order for the badge to be added to your wallet, you must accept the transaction!")
              }
            }
          }          
    }
}

// MAYBE -- IMPORTANT CODE for when i will check the mm address is the same as the one on the db
// ethereum.on('accountsChanged', function (accounts) {
//     // Time to reload your interface with accounts[0]!
//     window.location.reload();
//   });