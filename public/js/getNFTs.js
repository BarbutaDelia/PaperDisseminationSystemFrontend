import { NFTcontractAddress, NFTcontractAbi } from './config.js';
// connect to metamask if it's not connected
const IPFS = 'ipfs://';
const GATEWAY = 'https://GATEWAY.pinata.cloud/ipfs/';

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
        console.error(error);
    }
    const provider = window.ethereum;
    const web3 = new Web3(provider);
    let contractInstance = new web3.eth.Contract(NFTcontractAbi, NFTcontractAddress);
    let walletAddress = web3.currentProvider.selectedAddress;

    if (walletAddress.toUpperCase() !== document.getElementById("metamaskAddress").value.toUpperCase()) {
        setView(false);
    }
    else {
        contractInstance.defaultAccount = walletAddress;
        let nftsBalance = await contractInstance.methods.balanceOf(walletAddress).call();
        nftsBalance = parseInt(nftsBalance);
        const nftTemplate = document.getElementById("nft_template");
        // there are no NFTs associated with this account
        if (nftsBalance === 0) {
            setView(true);
        }
        for (let i = 0; i < nftsBalance; i++) {
            let tokenId = await contractInstance.methods.tokenOfOwnerByIndex(walletAddress, i).call();
            let tokenMetadataURI = await contractInstance.methods.tokenURI(tokenId).call();
            if (tokenMetadataURI.startsWith(IPFS)) {
                let CID = tokenMetadataURI.split(IPFS)[1];
                tokenMetadataURI = GATEWAY + CID;
            }
            let tokenMetadata;
            try {
                const response = await fetch(tokenMetadataURI);
                tokenMetadata = await response.json();
            } catch (error) {
                console.error("Failed to fetch token metadata:", error);
                continue;
            }
            let tokenMetadataImage = '';
            if (tokenMetadata['image'].startsWith(IPFS)) {
                var CID = tokenMetadata['image'].split(IPFS)[1];
                tokenMetadataImage = GATEWAY + CID;
            }
            const nftTokenElement = nftTemplate.content.cloneNode(true);
            nftTokenElement.querySelector('img').src = tokenMetadataImage;
            nftTokenElement.querySelector('p').innerHTML = tokenMetadata['description'];
            nftTokenElement.querySelector('#title').innerHTML = tokenMetadata.name;
            // nftTokenElement.querySelector('#view-opensea').href = OPENSEA_URL + NFTcontractAddress + "/" + (i + 1);
            document.getElementById('nfts').append(nftTokenElement);
        }
    }
});

function setView(status) {
    if (status) {
        document.getElementById('alert-nfts').removeAttribute('hidden');
    }
    else {
        document.querySelector(".card-body h2").textContent = "Sorry!";
        document.querySelector(".card-body p").textContent = "Please switch to the Metamask address associated with this account and refresh the page!";
        document.getElementById('alert-nfts').removeAttribute('hidden');
    }
}