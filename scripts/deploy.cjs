const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy DNAProofAccessControl as a UUPS proxy
  console.log("Deploying DNAProofAccessControl...");
  const AccessControl = await ethers.getContractFactory("DNAProofAccessControl");
  const accessControl = await upgrades.deployProxy(AccessControl, [], { kind: 'uups' });
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("DNAProofAccessControl deployed to:", accessControlAddress);

  // 2. Deploy DNAProofAuditLogs as a UUPS proxy
  console.log("Deploying DNAProofAuditLogs...");
  const AuditLogs = await ethers.getContractFactory("DNAProofAuditLogs");
  const auditLogs = await upgrades.deployProxy(AuditLogs, [], { kind: 'uups' });
  await auditLogs.waitForDeployment();
  const auditLogsAddress = await auditLogs.getAddress();
  console.log("DNAProofAuditLogs deployed to:", auditLogsAddress);

  // 3. Deploy DNAProofRegistry as a UUPS proxy
  console.log("Deploying DNAProofRegistry...");
  const Registry = await ethers.getContractFactory("DNAProofRegistry");
  // initialize(address _auditContract, address _paymentVault)
  const registry = await upgrades.deployProxy(Registry, [auditLogsAddress, deployer.address], { kind: 'uups' });
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("DNAProofRegistry deployed to:", registryAddress);

  // 4. Link Registry back to AuditLogs
  console.log("Linking Registry to AuditLogs...");
  await auditLogs.setRegistryContract(registryAddress);
  console.log("Linked!");

  console.log("\nSummary:");
  console.log("-------------------");
  console.log("DNAProofAccessControl:", accessControlAddress);
  console.log("DNAProofAuditLogs:   ", auditLogsAddress);
  console.log("DNAProofRegistry:    ", registryAddress);
  console.log("-------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});