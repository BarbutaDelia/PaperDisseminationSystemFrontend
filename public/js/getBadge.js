
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

// Function to check if MetaMask is installed
const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

async function mintNFT(provider, contract, tokenURI) {
  try {
    let response = await provider.request({ method: 'eth_requestAccounts' });
    console.log(response);
    const accounts = await provider.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      console.log("No account is connected");
      return;
    }
    const account = accounts[0];

    if (account.toUpperCase() !== document.getElementById("metamaskAddress").value.toUpperCase()) {
      setView("wrongMetamask");
    } else {
      setView("passedTest");
      try {
        const gasLimit = await contract.methods.mintNFT(account, tokenURI).estimateGas({
          from: account
        });
        const result = await contract.methods.mintNFT(account, tokenURI).send({
          from: account,
          gas: gasLimit
        });
      } catch (error) {
        if (error.message.includes("denied transaction signature")) {
          addAlert("In order for the badge to be added to your wallet, you must accept the transaction!")
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

if (CID != "") {
  if (!isMetaMaskInstalled()) {
    addAlert("Please install the metamask extension!");
    const onboarding = new MetaMaskOnboarding({ forwarderOrigin });
    onboarding.startOnboarding();
  } else {
    const provider = window.ethereum;
    const web3 = new Web3(provider);
    const tokenURI = IPFS + CID;
    const contract = new web3.eth.Contract(NFTcontractAbi, NFTcontractAddress);
    
    mintNFT(provider, contract, tokenURI);
  }
} else {
  setView("failedTest");
}

function setView(viewType) {
  if (viewType === "passedTest") {
    document.querySelector(".card-body h2").textContent = "Congratulations!";
    document.querySelector(".card-body i").className = "bi bi-check-circle-fill big-icon mb-4 text-success";
    document.querySelector(".card-body p").innerHTML = "You have passed the test and are eligible for a badge. In order to receive your badge, please accept the prompted metamask transaction.<br> Thank you for participating!";
  }
  else if (viewType === "failedTest"){
    document.querySelector(".card-body h2").textContent = "Thank you for submitting your test!";
    document.querySelector(".card-body i").className = "bi bi-exclamation-circle-fill big-icon mb-4 text-warning";
    document.querySelector(".card-body p").innerHTML = "Unfortunately, your score did not meet the necessary criteria to qualify for a badge. We encourage you to continue practicing and improving your skills, and to try again in the future. <br> Best of luck!";
  }
  else{
    document.querySelector(".card-body h2").textContent = "Sorry!";
    document.querySelector(".card-body i").className = "bi bi-exclamation-circle-fill big-icon mb-4 text-warning";
    document.querySelector(".card-body p").innerHTML = "Please switch to the Metamask address associated with this account and refresh the page!";
  
  }
}