
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
        const web3 = new Web3(provider);
        const tokenURI = IPFS + CID;
        console.log(tokenURI);
        const contract = new web3.eth.Contract(NFTcontractAbi, NFTcontractAddress);
        mintNFT();

        async function mintNFT() {
            try {
                await ethereum.request({ method: 'eth_requestAccounts' });
            } catch (error) {
                console.error(error);
            }

            const accounts = await web3.eth.getAccounts();

            try {
                const gasLimit = await contract.methods.mintNFT(accounts[0], tokenURI).estimateGas({
                    from: accounts[0]
                });

                const result = await contract.methods.mintNFT(accounts[0], tokenURI).send({
                    from: accounts[0],
                    gas: gasLimit
                });

                console.log(result);
            } catch (error) {
                // console.error(error);
                if (error.message.includes("denied transaction signature")) {
                    addAlert("In order for the badge to be added to your wallet, you must accept the transaction!")
                }
            }
        }
    }
}