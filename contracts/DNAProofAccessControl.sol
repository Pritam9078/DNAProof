// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title DNAProofAccessControl
 * @dev Implementation of the DNAProof Access Control system using UUPS upgradeable pattern.
 */
contract DNAProofAccessControl is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    uint256 public constant MAX_BATCH = 50;

    // Errors
    error DNAProofAC__ZeroAddress();
    error DNAProofAC__AlreadyHasRole(bytes32 role, address account);
    error DNAProofAC__DoesNotHaveRole(bytes32 role, address account);
    error DNAProofAC__CannotRemoveSelf(address account);
    error DNAProofAC__BatchEmpty();
    error DNAProofAC__BatchTooLarge(uint256 provided, uint256 max);
    error DNAProofAC__ContractPaused();

    // Events
    event AdminAdded(address indexed account, address indexed grantedBy);
    event AdminRemoved(address indexed account, address indexed removedBy);
    event IssuerAdded(address indexed account, address indexed grantedBy);
    event IssuerRemoved(address indexed account, address indexed removedBy);
    event VerifierAdded(address indexed account, address indexed grantedBy);
    event VerifierRemoved(address indexed account, address indexed removedBy);
    event AuditorAdded(address indexed account, address indexed grantedBy);
    event AuditorRemoved(address indexed account, address indexed removedBy);
    event BatchRoleGranted(bytes32 indexed role, uint256 count, address indexed grantedBy);
    event BatchRoleRevoked(bytes32 indexed role, uint256 count, address indexed removedBy);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __Pausable_init();
        __Ownable_init(msg.sender);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Role Checks
    function isAdmin(address account) public view returns (bool) {
        return hasRole(ADMIN_ROLE, account) || hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    function isIssuer(address account) public view returns (bool) {
        return hasRole(ISSUER_ROLE, account);
    }

    function isVerifier(address account) public view returns (bool) {
        return hasRole(VERIFIER_ROLE, account);
    }

    function isAuditor(address account) public view returns (bool) {
        return hasRole(AUDITOR_ROLE, account);
    }

    function getRoles(address account) public view returns (bool[4] memory roles) {
        roles[0] = isAdmin(account);
        roles[1] = isIssuer(account);
        roles[2] = isVerifier(account);
        roles[3] = isAuditor(account);
    }

    // Role Management
    function addAdmin(address account) public onlyRole(ADMIN_ROLE) {
        if (account == address(0)) revert DNAProofAC__ZeroAddress();
        if (hasRole(ADMIN_ROLE, account)) revert DNAProofAC__AlreadyHasRole(ADMIN_ROLE, account);
        _grantRole(ADMIN_ROLE, account);
        emit AdminAdded(account, msg.sender);
    }

    function removeAdmin(address account) public onlyRole(ADMIN_ROLE) {
        if (account == msg.sender) revert DNAProofAC__CannotRemoveSelf(account);
        if (!hasRole(ADMIN_ROLE, account)) revert DNAProofAC__DoesNotHaveRole(ADMIN_ROLE, account);
        _revokeRole(ADMIN_ROLE, account);
        emit AdminRemoved(account, msg.sender);
    }

    function addIssuer(address account) public onlyRole(ADMIN_ROLE) {
        if (account == address(0)) revert DNAProofAC__ZeroAddress();
        _grantRole(ISSUER_ROLE, account);
        emit IssuerAdded(account, msg.sender);
    }

    function removeIssuer(address account) public onlyRole(ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, account);
        emit IssuerRemoved(account, msg.sender);
    }

    function addVerifier(address account) public onlyRole(ADMIN_ROLE) {
        if (account == address(0)) revert DNAProofAC__ZeroAddress();
        _grantRole(VERIFIER_ROLE, account);
        emit VerifierAdded(account, msg.sender);
    }

    function removeVerifier(address account) public onlyRole(ADMIN_ROLE) {
        _revokeRole(VERIFIER_ROLE, account);
        emit VerifierRemoved(account, msg.sender);
    }

    function addAuditor(address account) public onlyRole(ADMIN_ROLE) {
        if (account == address(0)) revert DNAProofAC__ZeroAddress();
        _grantRole(AUDITOR_ROLE, account);
        emit AuditorAdded(account, msg.sender);
    }

    function removeAuditor(address account) public onlyRole(ADMIN_ROLE) {
        _revokeRole(AUDITOR_ROLE, account);
        emit AuditorRemoved(account, msg.sender);
    }

    // Batch Role Management
    function addIssuers(address[] calldata accounts) public onlyRole(ADMIN_ROLE) {
        _batchGrantRole(ISSUER_ROLE, accounts);
    }

    function addVerifiers(address[] calldata accounts) public onlyRole(ADMIN_ROLE) {
        _batchGrantRole(VERIFIER_ROLE, accounts);
    }

    function addAuditors(address[] calldata accounts) public onlyRole(ADMIN_ROLE) {
        _batchGrantRole(AUDITOR_ROLE, accounts);
    }

    function _batchGrantRole(bytes32 role, address[] calldata accounts) internal {
        if (accounts.length == 0) revert DNAProofAC__BatchEmpty();
        if (accounts.length > MAX_BATCH) revert DNAProofAC__BatchTooLarge(accounts.length, MAX_BATCH);

        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert DNAProofAC__ZeroAddress();
            _grantRole(role, accounts[i]);
        }
        emit BatchRoleGranted(role, accounts.length, msg.sender);
    }

    // Pause/Unpause
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
