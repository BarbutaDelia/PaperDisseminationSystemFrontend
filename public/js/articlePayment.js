
const forwarderOrigin = 'http://localhost:6789';
import { contractAddress, contractAbi, articlePaymentSum } from './config.js';

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
  var isMetamaskAddressCorrect = true;

  const contract = new web3.eth.Contract(contractAbi, contractAddress);

  async function callContractMethod() {
    try {
      await ethereum.request({ method: 'eth_requestAccounts' });

      const accounts = await web3.eth.getAccounts();
      let metamaskAddress = document.getElementById("metamaskAddress").value;
      if (metamaskAddress.toUpperCase() != accounts[0].toUpperCase()) {
        isMetamaskAddressCorrect = false;
        setView(isMetamaskAddressCorrect);
      }
      else {
        setView(isMetaMaskInstalled);
        const gasLimit = await contract.methods.payForArticle(articleId).estimateGas({
          from: accounts[0],
          value: web3.utils.toWei(articlePaymentSum, "ether")
        });

        const result = await contract.methods.payForArticle(articleId).send({
          from: accounts[0],
          gas: gasLimit,
          value: web3.utils.toWei(articlePaymentSum, "ether")
        });
      }
    } catch (error) {
      if (error.message.includes("denied transaction signature")) {
        addAlert("In order for the article to be added, you must accept the transaction!")
      }
    }
  }

  callContractMethod().catch(console.error);
}
function setView(status) {
  if (status) {
    document.querySelector(".card-body h2").textContent = "Please sign the Metamask transaction!";
    document.querySelector(".card-body i").className = "bi bi-check-circle-fill big-icon mb-4 text-success";
    document.querySelector(".card-body p").textContent = "In order for you article to be visible for reviews, you must complete the payment.";
  }
  else {
    document.querySelector(".card-body h2").textContent = "Sorry!";
    document.querySelector(".card-body i").className = "bi bi-exclamation-circle-fill big-icon mb-4 text-warning";
    document.querySelector(".card-body p").textContent = "Please switch to the Metamask address associated with this account and refresh the page!";
  }
}