import { ethers, Contract, Signer, BrowserProvider, JsonRpcProvider } from "ethers";

const ACCESS_CONTROL_ABI = [
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function getRoleAdmin(bytes32 role) external view returns (bytes32)"
];

export class AccessControlService {
  private contract: Contract | null = null;

  constructor(private config: { 
    rpcUrl: string; 
    address: string;
  }, private provider: JsonRpcProvider | BrowserProvider) {
    this.contract = new Contract(config.address, ACCESS_CONTROL_ABI, provider);
  }

  async connect(signer: Signer): Promise<void> {
    this.contract = new Contract(this.config.address, ACCESS_CONTROL_ABI, signer);
  }

  async grantRole(role: string, account: string): Promise<void> {
    if (!this.contract) throw new Error("AccessControl contract not initialized");
    const tx = await this.contract.grantRole(ethers.keccak256(ethers.toUtf8Bytes(role)), account);
    await tx.wait();
  }

  async revokeRole(role: string, account: string): Promise<void> {
    if (!this.contract) throw new Error("AccessControl contract not initialized");
    const tx = await this.contract.revokeRole(ethers.keccak256(ethers.toUtf8Bytes(role)), account);
    await tx.wait();
  }

  async hasRole(role: string, account: string): Promise<boolean> {
    if (!this.contract) throw new Error("AccessControl contract not initialized");
    return await this.contract.hasRole(ethers.keccak256(ethers.toUtf8Bytes(role)), account);
  }
}
