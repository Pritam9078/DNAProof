const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

// ─────────────────────────────────────────────────────────────
// CONFIGURATION — Edit these before running
// ─────────────────────────────────────────────────────────────
const ACCESS_CONTROL_ADDRESS = process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS
  || "0x96FC568bC13eb9F4EAbB47190525158De9FCc99A";

// Wallet to receive the role
const TARGET_WALLET = "0xFA0978539bbb30776ED0664D2413A8A6F8145A61";

// Role to grant: "ADMIN_ROLE" | "ISSUER_ROLE" | "VERIFIER_ROLE" | "AUDITOR_ROLE"
const ROLE_TO_GRANT = "ISSUER_ROLE";
// ─────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🔑 Deployer (Super Admin): ${deployer.address}`);
  console.log(`📄 AccessControl Contract: ${ACCESS_CONTROL_ADDRESS}`);
  console.log(`👤 Target Wallet:          ${TARGET_WALLET}`);
  console.log(`🎖️  Role to grant:          ${ROLE_TO_GRANT}\n`);

  const AccessControl = await ethers.getContractAt(
    "DNAProofAccessControl",
    ACCESS_CONTROL_ADDRESS
  );

  // Get the role bytes32 hash
  const roleHash = await AccessControl[ROLE_TO_GRANT]();
  console.log(`Role hash: ${roleHash}`);

  // Check if they already have the role
  const alreadyHasRole = await AccessControl.hasRole(roleHash, TARGET_WALLET);
  if (alreadyHasRole) {
    console.log(`✅ ${TARGET_WALLET} already has ${ROLE_TO_GRANT}. Nothing to do.`);
    return;
  }

  // Grant the role using the appropriate function
  let tx;
  if (ROLE_TO_GRANT === "ADMIN_ROLE") {
    tx = await AccessControl.addAdmin(TARGET_WALLET);
  } else if (ROLE_TO_GRANT === "ISSUER_ROLE") {
    tx = await AccessControl.addIssuer(TARGET_WALLET);
  } else if (ROLE_TO_GRANT === "VERIFIER_ROLE") {
    tx = await AccessControl.addVerifier(TARGET_WALLET);
  } else if (ROLE_TO_GRANT === "AUDITOR_ROLE") {
    tx = await AccessControl.addAuditor(TARGET_WALLET);
  } else {
    throw new Error(`Unknown role: ${ROLE_TO_GRANT}`);
  }

  console.log(`⏳ Transaction submitted: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ ${ROLE_TO_GRANT} successfully granted to ${TARGET_WALLET}!`);
  console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exitCode = 1;
});
