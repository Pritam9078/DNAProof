// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title DNAProofRegistry
 * @dev Main registry for document proofs on Ethereum.
 */
contract DNAProofRegistry is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    bytes32 public constant DOC_TYPE_GOV_ID = keccak256("GOV_ID");
    bytes32 public constant DOC_TYPE_LICENSE = keccak256("LICENSE");
    bytes32 public constant DOC_TYPE_DEGREE = keccak256("DEGREE");
    bytes32 public constant DOC_TYPE_CONTRACT = keccak256("CONTRACT");
    bytes32 public constant DOC_TYPE_CUSTOM = keccak256("CUSTOM");

    uint256 public constant MAX_BATCH = 50;
    uint256 public constant PHASH_THRESHOLD = 5; // Example threshold for perceptual hash
    uint256 public constant RATE_LIMIT_SECONDS = 60;

    address public auditContract;
    address public paymentVault;

    uint256 private _docIdCounter;

    enum VerifyStatus { INVALID, VALID, REVOKED, EXPIRED, MISMATCH }

    struct RegistrationInput {
        bytes32 sha256Hash;
        bytes32 perceptualHash;
        bytes32 metadataHash;
        bytes32 zkProofHash;
        string ipfsHash;
        bytes32 docType;
        address owner;
        uint256 expiryDate;
        bool isPublic;
    }

    struct DocumentRecord {
        bytes32 sha256Hash;
        bytes32 perceptualHash;
        bytes32 metadataHash;
        bytes32 zkProofHash;
        string ipfsHash;
        bytes32 docType;
        address owner;
        uint256 timestamp;
        uint256 expiryDate;
        bool isValid;
        bool isPublic;
        uint8 trustScore;
        uint256 version;
        bool zkpVerified;
    }

    mapping(uint256 => DocumentRecord) private _documents;
    mapping(bytes32 => uint256) private _sha2HashToId;
    mapping(address => uint256) private _lastActionTimestamp;
    mapping(address => uint256) private _issuerReputation;
    mapping(address => string) private _issuerDIDs;
    mapping(uint256 => mapping(address => bool)) private _documentSignatures;
    mapping(uint256 => uint256) private _signatureCount;
    address private _zkVerifier;

    // Errors
    error DNAProof__ZeroAddress();
    error DNAProof__ZeroHash();
    error DNAProof__DocumentAlreadyExists(bytes32 fingerprint, uint256 existingId);
    error DNAProof__DocumentNotFound(uint256 docId);
    error DNAProof__AlreadyRevoked(uint256 docId);
    error DNAProof__InvalidDocType();
    error DNAProof__InvalidExpiry(uint256 provided);
    error DNAProof__NotAuthorized(address caller);
    error DNAProof__RateLimitExceeded(address caller, uint256 retryAfter);
    error DNAProof__BatchEmpty();
    error DNAProof__BatchTooLarge(uint256 provided, uint256 max);
    error DNAProof__EmptyString();
    error DNAProof__ReputationOutOfRange(uint256 score);
    error DNAProof__SubscriptionRequired(address issuer);

    // Events
    event DocumentRegistered(
        uint256 indexed docId, 
        address indexed owner, 
        bytes32 indexed sha256Hash, 
        bytes32 docType, 
        uint256 expiryDate,
        uint256 version,
        uint8 trustScore,
        bool isPublic
    );
    event DocumentVerified(uint256 indexed docId, bool isValid, VerifyStatus status, address indexed caller);
    event DocumentRevoked(uint256 indexed docId, address indexed revokedBy, uint256 timestamp);
    event DocumentZkVerified(uint256 indexed docId, address indexed verifier);
    event AdminUpdated(address indexed previous, address indexed next);
    event PaymentVaultUpdated(address indexed previous, address indexed next);
    event IssuerReputationSet(address indexed issuer, uint256 score);
    event IssuerDIDSet(address indexed issuer, string did);
    event DocumentAttested(uint256 indexed docId, address indexed attester);

    // Initializer
    function initialize(address _admin, address _auditContract, address _paymentVault) public initializer {
        __AccessControl_init();

        _grantRole(ADMIN_ROLE, _admin);
        
        auditContract = _auditContract;
        paymentVault = _paymentVault;
    }

    // External Functions
    function registerDocument(RegistrationInput calldata input) external returns (uint256 docId) {
        if (input.sha256Hash == bytes32(0)) revert DNAProof__ZeroHash();
        if (input.owner == address(0)) revert DNAProof__ZeroAddress();
        if (bytes(input.ipfsHash).length == 0) revert DNAProof__EmptyString();
        
        uint256 existingId = _sha2HashToId[input.sha256Hash];
        if (existingId != 0) revert DNAProof__DocumentAlreadyExists(input.sha256Hash, existingId);

        docId = _docIdCounter++;
        
        _documents[docId] = DocumentRecord({
            sha256Hash: input.sha256Hash,
            perceptualHash: input.perceptualHash,
            metadataHash: input.metadataHash,
            zkProofHash: input.zkProofHash,
            ipfsHash: input.ipfsHash,
            docType: input.docType,
            owner: input.owner,
            timestamp: block.timestamp,
            expiryDate: input.expiryDate,
            isValid: true,
            isPublic: input.isPublic,
            trustScore: 100, // Initial score
            version: 1,
            zkpVerified: false
        });

        _sha2HashToId[input.sha256Hash] = docId;

        emit DocumentRegistered(
            docId, 
            input.owner, 
            input.sha256Hash, 
            input.docType, 
            input.expiryDate, 
            1, 
            100, 
            input.isPublic
        );

        return docId;
    }

    function registerBatch(RegistrationInput[] calldata inputs) external returns (uint256[] memory docIds) {
        if (inputs.length == 0) revert DNAProof__BatchEmpty();
        if (inputs.length > MAX_BATCH) revert DNAProof__BatchTooLarge(inputs.length, MAX_BATCH);

        docIds = new uint256[](inputs.length);
        for (uint256 i = 0; i < inputs.length; i++) {
            docIds[i] = this.registerDocument(inputs[i]);
        }
        return docIds;
    }

    function verifyDocument(
        uint256 docId, 
        bytes32 sha256Hash, 
        bytes32 perceptualHash, 
        bytes32 metadataHash, 
        bool perceptualVerified
    ) external returns (bool isValid, VerifyStatus status) {
        DocumentRecord memory doc = _documents[docId];
        if (doc.timestamp == 0) {
            emit DocumentVerified(docId, false, VerifyStatus.INVALID, msg.sender);
            return (false, VerifyStatus.INVALID);
        }

        if (!doc.isValid) {
            emit DocumentVerified(docId, false, VerifyStatus.REVOKED, msg.sender);
            return (false, VerifyStatus.REVOKED);
        }

        if (doc.expiryDate != 0 && block.timestamp > doc.expiryDate) {
            emit DocumentVerified(docId, false, VerifyStatus.EXPIRED, msg.sender);
            return (false, VerifyStatus.EXPIRED);
        }

        if (doc.sha256Hash != sha256Hash) {
            emit DocumentVerified(docId, false, VerifyStatus.MISMATCH, msg.sender);
            return (false, VerifyStatus.MISMATCH);
        }

        // Logic check for perceptual and metadata (simplified)
        isValid = true;
        status = VerifyStatus.VALID;

        emit DocumentVerified(docId, isValid, status, msg.sender);
        return (isValid, status);
    }

    function revokeDocument(uint256 docId) external {
        DocumentRecord storage doc = _documents[docId];
        if (doc.timestamp == 0) revert DNAProof__DocumentNotFound(docId);
        if (!doc.isValid) revert DNAProof__AlreadyRevoked(docId);
        
        if (msg.sender != doc.owner && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert DNAProof__NotAuthorized(msg.sender);
        }

        doc.isValid = false;
        emit DocumentRevoked(docId, msg.sender, block.timestamp);
    }

    // View Functions
    function getDocument(uint256 docId) external view returns (DocumentRecord memory) {
        DocumentRecord memory doc = _documents[docId];
        if (doc.timestamp == 0) revert DNAProof__DocumentNotFound(docId);
        return doc;
    }

    function getDocIdBySha256(bytes32 sha256Hash) external view returns (uint256) {
        return _sha2HashToId[sha256Hash];
    }

    // Admin Functions
    function setAuditContract(address _auditContract) external onlyRole(ADMIN_ROLE) {
        if (_auditContract == address(0)) revert DNAProof__ZeroAddress();
        auditContract = _auditContract;
    }

    function setZkVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
        if (verifier == address(0)) revert DNAProof__ZeroAddress();
        _zkVerifier = verifier;
    }

    function verifyZkProof(
        uint256 docId,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[1] calldata input
    ) external returns (bool) {
        DocumentRecord storage doc = _documents[docId];
        if (doc.timestamp == 0) revert DNAProof__DocumentNotFound(docId);
        if (_zkVerifier == address(0)) revert DNAProof__ZeroAddress();

        // In a real implementation:
        // bool success = IZkVerifier(_zkVerifier).verifyProof(a, b, c, input);
        // require(success, "Invalid ZK proof");
        
        doc.zkpVerified = true;
        emit DocumentZkVerified(docId, msg.sender);
        return true;
    }

    function setIssuerReputation(address issuer, uint256 score) external onlyRole(ADMIN_ROLE) {
        if (score > 100) revert DNAProof__ReputationOutOfRange(score);
        _issuerReputation[issuer] = score;
        emit IssuerReputationSet(issuer, score);
    }

    function setIssuerDID(address issuer, string calldata did) external onlyRole(ADMIN_ROLE) {
        if (bytes(did).length == 0) revert DNAProof__EmptyString();
        _issuerDIDs[issuer] = did;
        emit IssuerDIDSet(issuer, did);
    }

    function attestDocument(uint256 docId) external onlyRole(ISSUER_ROLE) {
        DocumentRecord storage doc = _documents[docId];
        if (doc.timestamp == 0) revert DNAProof__DocumentNotFound(docId);
        if (_documentSignatures[docId][msg.sender]) revert DNAProof__NotAuthorized(msg.sender); // Already signed

        _documentSignatures[docId][msg.sender] = true;
        _signatureCount[docId]++;
        
        emit DocumentAttested(docId, msg.sender);
    }

    function getIssuerDID(address issuer) external view returns (string memory) {
        return _issuerDIDs[issuer];
    }

    function getSignatureCount(uint256 docId) external view returns (uint256) {
        return _signatureCount[docId];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
