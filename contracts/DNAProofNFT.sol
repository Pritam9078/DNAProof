// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DNAProofNFT
 * @dev ERC721 token representing document ownership and certificates within the DNAProof system.
 * This contract enables minting NFTs that are linked to off-chain document records and IPFS metadata.
 */
contract DNAProofNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _nextTokenId;

    event DocumentNFTMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor() ERC721("DNAProof Document NFT", "DNADoc") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mints a new document NFT.
     * @param to The recipient address of the document NFT.
     * @param uri The metadata URI (typically an IPFS link) for the document.
     * @return uint256 The newly minted token ID.
     */
    function mintDocumentNFT(address to, string memory uri) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit DocumentNFTMinted(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Requirements:
     * - `interfaceId` must be supported.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
