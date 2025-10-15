import { BrowserProvider, Contract, type Eip1193Provider, type InterfaceAbi } from "ethers";
import VotingArtifact from "../abi/Voting_ShayanAhmed.json";
import { CONTRACT_ADDRESS, TARGET_CHAIN_ID } from "../config";

export type Candidate = { id: bigint; name: string; voteCount: bigint };

function getEthereum(): Eip1193Provider {
  const eth = (globalThis as unknown as { window?: { ethereum?: Eip1193Provider } }).window?.ethereum;
  if (!eth) throw new Error("MetaMask not found");
  return eth;
}

export async function getProvider(): Promise<BrowserProvider> {
  const provider = new BrowserProvider(getEthereum());
  return provider;
}

export async function connectWallet(): Promise<string> {
  const provider = await getProvider();
  const accounts = await provider.send("eth_requestAccounts", []);
  await ensureChain(provider);
  return accounts[0];
}

export async function ensureChain(provider?: BrowserProvider) {
  const p = provider ?? (await getProvider());
  const network = await p.getNetwork();
  if (Number(network.chainId) !== TARGET_CHAIN_ID) {
    throw new Error(`Wrong network. Connect to chainId ${TARGET_CHAIN_ID}.`);
  }
}

export async function getSignerAndContract() {
  const provider = await getProvider();
  await ensureChain(provider);
  const signer = await provider.getSigner();
  const contract = new Contract(
    CONTRACT_ADDRESS,
    (VotingArtifact as { abi: InterfaceAbi }).abi,
    signer
  );
  return { signer, contract };
}

export async function fetchCandidates(contract: Contract): Promise<Candidate[]> {
  const list: Array<{ id: bigint; name: string; voteCount: bigint }> = await contract.getAllCandidates();
  return list.map((c) => ({ id: c.id, name: c.name, voteCount: c.voteCount }));
}

export async function isAdmin(contract: Contract, account: string): Promise<boolean> {
  const admin = await contract.admin();
  return admin.toLowerCase() === account.toLowerCase();
}

export async function getRemainingSeconds(contract: Contract): Promise<number> {
  const seconds: bigint = await contract.getRemainingTime();
  return Number(seconds);
}


