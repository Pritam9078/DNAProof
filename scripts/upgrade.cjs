const { ethers, upgrades } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
  const REGISTRY_PROXY_ADDRESS = process.env.VITE_REGISTRY_ADDRESS || "0x35a05b541645052f9eAB56336470b9632e7BF5dB";
  console.log("Upgrading DNAProofRegistry proxy at:", REGISTRY_PROXY_ADDRESS);

  const RegistryV2 = await ethers.getContractFactory("DNAProofRegistry");
  console.log("Upgrading...");
  const registry = await upgrades.upgradeProxy(REGISTRY_PROXY_ADDRESS, RegistryV2);
  
  await registry.waitForDeployment();
  console.log("DNAProofRegistry successfully upgraded!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
