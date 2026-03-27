// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title DNAProofAuditLogs
 * @dev Contract for storing and retrieving audit logs for DNAProof documents.
 */
contract DNAProofAuditLogs is 
    Initializable, 
    AccessControlUpgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    uint256 public constant MAX_BATCH = 50;

    address public registryContract;
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum AuditAction { REGISTER, VERIFY, REVOKE, UPDATE, OTHER }

    struct LogEntry {
        address actor;
        AuditAction action;
        uint256 timestamp;
        bytes extraData;
    }

    mapping(uint256 => LogEntry[]) private _logs;

    // Errors
    error DNAProofAudit__OnlyRegistry();
    error DNAProofAudit__BatchEmpty();
    error DNAProofAudit__BatchTooLarge(uint256 provided, uint256 max);
    error DNAProofAudit__NotInRegistry();

    // Events
    event LogEntryCreated(uint256 indexed docId, address indexed actor, AuditAction action, uint256 timestamp, bytes extraData);
    event RegistryUpdated(address indexed previous, address indexed next);
    
    error DNAProofAudit__NotAuthorized();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __Ownable_init(msg.sender);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyAuthorized() {
        if (msg.sender != registryContract && !hasRole(VERIFIER_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert DNAProofAudit__NotAuthorized();
        }
        _;
    }

    // External Functions
    function logAction(
        uint256 docId, 
        address actor, 
        AuditAction action, 
        bytes calldata extraData
    ) external {
        // Permission logic:
        // 1. If it's a VERIFY action, allow if actor == msg.sender (to prevent impersonation)
        // 2. Otherwise, check registry/admin/verifier permissions
        if (action == AuditAction.VERIFY) {
            if (msg.sender != actor && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert DNAProofAudit__NotAuthorized();
        } else {
            if (msg.sender != registryContract && !hasRole(VERIFIER_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
                revert DNAProofAudit__NotAuthorized();
            }
        }

        _logs[docId].push(LogEntry({
            actor: actor,
            action: action,
            timestamp: block.timestamp,
            extraData: extraData
        }));
        emit LogEntryCreated(docId, actor, action, block.timestamp, extraData);
    }

    function logBatchActions(
        uint256[] calldata docIds, 
        address actor, 
        AuditAction action, 
        bytes[] calldata extraDatas
    ) external {
        if (docIds.length == 0) revert DNAProofAudit__BatchEmpty();
        if (docIds.length > MAX_BATCH) revert DNAProofAudit__BatchTooLarge(docIds.length, MAX_BATCH);
        if (docIds.length != extraDatas.length) revert DNAProofAudit__BatchTooLarge(docIds.length, extraDatas.length); // mismatch

        if (action == AuditAction.VERIFY) {
            if (msg.sender != actor && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert DNAProofAudit__NotAuthorized();
        } else {
            if (msg.sender != registryContract && !hasRole(VERIFIER_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
                revert DNAProofAudit__NotAuthorized();
            }
        }

        for (uint256 i = 0; i < docIds.length; i++) {
            _logs[docIds[i]].push(LogEntry({
                actor: actor,
                action: action,
                timestamp: block.timestamp,
                extraData: extraDatas[i]
            }));
            emit LogEntryCreated(docIds[i], actor, action, block.timestamp, extraDatas[i]);
        }
    }

    // View Functions
    function getAuditLogs(uint256 docId) external view returns (LogEntry[] memory) {
        return _logs[docId];
    }

    // Admin Functions
    function setRegistryContract(address registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit RegistryUpdated(registryContract, registry);
        registryContract = registry;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
