# BlockVault

A blockchain and IPFS file-upload prototype built by **Gogula Ajay**. The application encrypts a selected file in the browser, uploads the encrypted bytes through a Node.js API to Pinata, and records the file metadata with a smart-contract transaction on Sepolia.

[Portfolio](https://gogula-ajay-portfolio.gogulaajay2004.chatgpt.site/) · [Author](https://github.com/gogulaajay2004-design)

## What the current application does

- Connects to MetaMask and responds to account changes.
- Validates a recipient wallet address and a future expiry time.
- Encrypts file contents with a fresh AES-256-GCM key and a random 12-byte IV using the Web Crypto API.
- Uploads the encrypted file through an Express API to Pinata's public IPFS network.
- Requests a switch to Sepolia and calls the configured contract's `uploadFile` method.
- Displays the IPFS CID, transaction hash, and an Etherscan transaction link.

## Upload flow

1. Connect a MetaMask wallet.
2. Choose a file, enter the recipient address, and select a future expiry.
3. The browser creates an encrypted blob containing the IV followed by the encrypted file bytes.
4. The backend uploads that blob to Pinata and returns its CID.
5. MetaMask requests approval for the Sepolia transaction.
6. The interface reports confirmation after the transaction is mined.

## Technology

| Layer | Tools |
| --- | --- |
| Interface | React, Vite, JavaScript, CSS |
| Wallet and contract calls | MetaMask, Ethers.js |
| Encryption | Browser Web Crypto API, AES-GCM |
| Upload API | Node.js, Express, Multer |
| Storage | IPFS through Pinata |
| Blockchain network | Ethereum Sepolia testnet |

## Run locally

Use a Node.js version supported by the checked-in Vite version and providing the server's native `fetch`, `File`, and `FormData` APIs. You also need npm, MetaMask, a Pinata JWT with upload permissions, and Sepolia test ETH.

### 1. Install the frontend

```bash
git clone https://github.com/gogulaajay2004-design/blockvault.git
cd blockvault
npm ci
```

### 2. Configure and start the backend

```bash
cd server
npm install
```

Copy `.env.example` to `.env` in the `server` directory, then replace the placeholder with your Pinata JWT:

```dotenv
PINATA_JWT=your_pinata_jwt_here
PORT=5000
```

Keep this credential in `server/.env`; do not commit it or put it in frontend code.

Start the API:

```bash
node server.mjs
```

The API health endpoint is `http://localhost:5000/api/health`.

### 3. Start the frontend

Open another terminal in the repository root:

```bash
npm run dev
```

Open the local URL printed by Vite. The current frontend calls `http://localhost:5000/api/upload`, so use port 5000 for the backend unless you also update that URL in `src/App.jsx`.

### 4. Try the upload flow

Connect MetaMask, select a small non-sensitive test file, and provide a recipient wallet and future expiry. Review the Sepolia transaction request before confirming it.

The backend upload limit is **10 MiB** for the encrypted file; encryption adds a small amount of overhead to the original file size. A successful IPFS upload alone does not mean the blockchain transaction succeeded; check the final status.

## Repository layout

- `src/App.jsx` — wallet connection, browser encryption, upload, and transaction flow.
- `src/contractConfig.js` — configured contract address and ABI.
- `src/App.css` and `src/index.css` — interface styling.
- `server/server.mjs` — upload API and Pinata integration.
- `server/.env.example` — configuration names with placeholder values.

## Contract configuration

The frontend targets **Sepolia** (chain ID `11155111`) and reads the address and ABI from `src/contractConfig.js`. Confirm that the configured contract and ABI match your deployment before using it. Solidity source code and deployment scripts are not included in this repository.

The ABI also lists access-management and retrieval methods. These are not currently exposed as complete workflows in the interface.

## Current scope and limitations

This repository demonstrates the encrypted upload and metadata-recording flow. It does not yet implement a complete recipient download, key exchange, or decryption workflow.

The generated encryption key is held only in browser memory. It is not exported or delivered to the recipient, and a page reload loses that key. Do not use this prototype to store the only copy of a file.

The encrypted file is uploaded to public IPFS, and filenames and other transaction metadata may be public. Recording an expiry on-chain does not remove a file from IPFS or revoke a decryption key already held by a recipient.

The upload endpoint currently allows cross-origin requests and has no authentication or rate limiting. Add these controls, durable key management, contract-source verification, and an independent security review before any production use.

## Development commands

```bash
npm run build
npm run preview
npm run lint
```

## Next development milestones

- Recipient file listing, download, and decryption.
- Secure key delivery and recovery.
- Interface controls for access grants, expiry checks, and revocation.
- Contract source and reproducible deployment instructions.
- API authentication, rate limiting, and deployment configuration.

## Author

**Gogula Ajay** — Full-stack development, data analysis, and AI/ML projects.

[View portfolio](https://gogula-ajay-portfolio.gogulaajay2004.chatgpt.site/) · [InnoFlowlink Tech](https://innoflowlinktech.com/)
