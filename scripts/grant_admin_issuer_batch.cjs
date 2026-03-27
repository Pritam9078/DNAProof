const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

const ACCESS_CONTROL_ADDRESS = process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS
  || "0x96FC568bC13eb9F4EAbB47190525158De9FCc99A";

const TARGET_WALLET = "0x1b8d9335bf337107201B975828de4Fffacf10E47";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🔑 Deployer (Super Admin): ${deployer.address}`);
  console.log(`👤 Target Wallet:          ${TARGET_WALLET}\n`);

  const AccessControl = await ethers.getContractAt(
    "DNAProofAccessControl",
    ACCESS_CONTROL_ADDRESS
  );

  // Grant ADMIN_ROLE
  console.log("⏳ Granting ADMIN_ROLE...");
  const tx1 = await AccessControl.addAdmin(TARGET_WALLET);
  await tx1.wait();
  console.log("✅ ADMIN_ROLE granted!");

  // Grant ISSUER_ROLE
  console.log("⏳ Granting ISSUER_ROLE...");
  const tx2 = await AccessControl.addIssuer(TARGET_WALLET);
  await tx2.wait();
  console.log("✅ ISSUER_ROLE granted!");

  console.log(`\n🎉 All roles granted successfully to ${TARGET_WALLET}!`);
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exitCode = 1;
});
