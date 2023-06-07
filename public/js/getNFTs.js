import { NFTcontractAddress, NFTcontractAbi } from './config.js';
// connect to metamask if it's not connected
const IPFS = 'ipfs://';
const GATEWAY = 'https://GATEWAY.pinata.cloud/ipfs/';
const OPENSEA_URL = 'https://testnets.opensea.io/assets/goerli/';
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
    contractInstance.defaultAccount = walletAddress;
    let nftsBalance = await contractInstance.methods.balanceOf(walletAddress).call();
    nftsBalance = parseInt(nftsBalance);

    const nftTemplate = document.getElementById("nft_template");
    console.log(nftsBalance);
    if (nftsBalance === 0) {
        document.getElementById('alert-nfts').removeAttribute('hidden');
    }

    for (let i = 0; i < nftsBalance; i++) {
        let tokenId = await contractInstance.methods.tokenOfOwnerByIndex(walletAddress, i).call();

        let tokenMetadataURI = await contractInstance.methods.tokenURI(tokenId).call();

        if (tokenMetadataURI.startsWith(IPFS)) {
            let CID = tokenMetadataURI.split(IPFS)[1];
            tokenMetadataURI = GATEWAY + CID;
        }
        console.log(tokenMetadataURI)

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
        console.log(tokenMetadata);

        document.getElementById('nfts').append(nftTokenElement);
    }
});