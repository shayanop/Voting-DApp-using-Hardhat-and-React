# Voting DApp (Hardhat + React)

A decentralized Voting application built with Solidity, Hardhat, Ignition and a React (Vite) frontend. It supports:
- Admin adds candidates
- Each address can vote once
- On-chain vote storage
- Live results and countdown timer
- Events: VoteCast, VotingEnded
- Winner auto-displays after voting ends

Personalization: contract named `Voting_ShayanAhmed` and the frontend footer shows the student name.

---

## Tech Stack
- Solidity ^0.8.28, Hardhat, Ignition
- Ethers v6, Chai tests
- React + Vite + TypeScript

---

## Project Structure
```
my-dapp/
  contracts/
    Voting_ShayanAhmed.sol
  ignition/
    modules/
      Voting.js               # Ignition deployment module
  scripts/
    deploy.js                 # Classic run deployment script
  test/
    Voting.js                 # Unit tests
  frontend/
    src/
      App.tsx, lib/eth.ts, config.ts, abi/Voting_ShayanAhmed.json
```

---

## Prerequisites
- Node.js 18+
- MetaMask (browser)

---

## Install
From the project root:
```
npm install
cd frontend && npm install
```

---

## Local Development (Recommended)
1) Start a local Hardhat node (keep running):
```
npx hardhat node
```

2) Deploy the contract (pick one):
- Classic run script (always deploys a fresh instance):
```
npm run deploy:run
```
- Ignition (re-uses by default; use a new deployment id for a new address):
```
npm run deploy
# or force fresh
npx hardhat ignition deploy ignition/modules/Voting.js --network localhost --deployment-id round-1
```

3) Copy the printed contract address (0x…)

4) Configure frontend env and run the app:
```
cd frontend
# create or edit .env
VITE_CONTRACT_ADDRESS=0x<address from step 3>
VITE_CHAIN_ID=1337

npm run dev
```
Visit `http://localhost:5173`.

5) MetaMask setup (once):
- Add network manually:
  - Network name: Hardhat Local
  - RPC URL: http://127.0.0.1:8545
  - Chain ID: 1337
  - Currency: ETH
- Import the first private key from `npx hardhat node` output to act as Admin (deployer).

---

## Admin vs Voter
- Admin = deployer address. When connected as admin, the UI shows an Admin panel (add candidate, end voting).
- Voters = any other addresses on the network. Each can vote once.

If voting has ended (duration elapsed or admin ended it), deploy a fresh instance and update the frontend `.env` with the new contract address.

---

## Tests
Run all tests from the project root:
```
npx hardhat test
```

---

## Sepolia / Testnet Deployment (Optional)
1) Set environment variables (project root):
```
# .env (create if missing)
SEPOLIA_URL=https://sepolia.infura.io/v3/<your-key>
PRIVATE_KEY=0x<your-private-key>
ETHERSCAN_API_KEY=<optional-for-verify>
```

2) Deploy with Ignition:
```
npm run deploy:sepolia
```

3) Point the frontend to Sepolia:
```
# frontend/.env
VITE_CONTRACT_ADDRESS=0x<sepolia-contract>
VITE_CHAIN_ID=11155111
```
Restart `npm run dev` from `frontend/` and switch MetaMask to Sepolia.

---

## Useful Commands
- Compile: `npx hardhat compile`
- Local node: `npx hardhat node`
- Deploy (local, Ignition): `npm run deploy`
- Deploy (local, classic): `npm run deploy:run`
- Tests: `npx hardhat test`
- Clean: `npx hardhat clean`

---

## Troubleshooting
- Blank frontend page:
  - Check browser console errors.
  - Ensure `frontend/.env` has the correct `VITE_CONTRACT_ADDRESS` and `VITE_CHAIN_ID`, then restart `npm run dev`.
  - Make sure MetaMask is on the correct network (1337 for local) and click "Connect MetaMask".
- BAD_DATA or `getCode` returns `0x`:
  - The address is not a contract on the current node. Re-deploy and use the new address.
- Ignition reuses the same address:
  - Use `--deployment-id` with a new name, or `npm run deploy:run`, or restart the node.

---

## Screenshots (to include in submission)
- Deployed contract (terminal output)
- Voting flow (adding candidates, casting votes)
- Results / winner displayed in the UI

---

## Security Notes
- This is an educational project; not audited for production use.
- Do not use real/private mainnet keys.

---

## License
MIT
