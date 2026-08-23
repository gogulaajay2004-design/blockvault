import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "./contractConfig";
import "./App.css";

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [expiry, setExpiry] = useState("");
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [, setEncryptionKey] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [transactionHash, setTransactionHash] =
    useState("");

  const encryptSelectedFile = async () => {
    if (!window.ethereum) {
      alert("MetaMask install cheyyandi.");
      return;
    }

    if (!walletAddress) {
      alert("Munduga MetaMask connect cheyyandi.");
      return;
    }

    if (!selectedFile || !recipient || !expiry) {
      alert(
        "File, recipient address and expiry details enter cheyyandi."
      );
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      alert("Valid recipient wallet address enter cheyyandi.");
      return;
    }

    if (new Date(expiry) <= new Date()) {
      alert("Future expiry date and time select cheyyandi.");
      return;
    }

    try {
      setIpfsCid("");
      setTransactionHash("");
      setUploadStatus("Encrypting file...");

      const fileBuffer = await selectedFile.arrayBuffer();

      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );

      const iv = window.crypto.getRandomValues(
        new Uint8Array(12)
      );

      const encryptedBuffer =
        await window.crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv,
          },
          key,
          fileBuffer
        );

      const encryptedBlob = new Blob(
        [iv, encryptedBuffer],
        {
          type: "application/octet-stream",
        }
      );

      setEncryptedFile(encryptedBlob);
      setEncryptionKey(key);
      setUploadStatus(
        "Uploading encrypted file to IPFS..."
      );

      const formData = new FormData();

      formData.append(
        "file",
        encryptedBlob,
        `${selectedFile.name}.encrypted`
      );

      const response = await fetch(
        "http://localhost:5000/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "IPFS upload failed."
        );
      }

      setIpfsCid(result.cid);
      setUploadStatus(
        "IPFS upload successful. Waiting for MetaMask..."
      );

      const currentChainId =
        await window.ethereum.request({
          method: "eth_chainId",
        });

      if (currentChainId !== "0xaa36a7") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
            },
          ],
        });
      }

      const provider = new BrowserProvider(
        window.ethereum
      );

      const signer = await provider.getSigner();

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      const expiryTimestamp = Math.floor(
        new Date(expiry).getTime() / 1000
      );

      setUploadStatus(
        "Please confirm the transaction in MetaMask..."
      );

      const transaction = await contract.uploadFile(
        result.cid,
        selectedFile.name,
        recipient,
        expiryTimestamp
      );

      setTransactionHash(transaction.hash);
      setUploadStatus(
        "Blockchain transaction submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      setUploadStatus(
        "File encrypted, uploaded to IPFS and recorded on blockchain!"
      );

      alert(
        `BlockVault upload successful!\nCID: ${result.cid}\nTransaction: ${transaction.hash}`
      );
    } catch (error) {
      console.error(
        "Encryption, IPFS or blockchain operation failed:",
        error
      );

      let message =
        error?.shortMessage ||
        error?.reason ||
        error?.message ||
        "Operation failed.";

      if (
        error?.code === 4001 ||
        error?.code === "ACTION_REJECTED"
      ) {
        message =
          "MetaMask transaction was rejected.";
      }

      setUploadStatus(message);
      alert(message);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const accounts =
        await window.ethereum.request({
          method: "eth_requestAccounts",
        });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error(
        "Wallet connection failed:",
        error
      );

      alert(
        "MetaMask connection cancelled or failed."
      );
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const checkWalletConnection = async () => {
      try {
        const accounts =
          await window.ethereum.request({
            method: "eth_accounts",
          });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error(
          "Wallet check failed:",
          error
        );
      }
    };

    const handleAccountsChanged = (accounts) => {
      setWalletAddress(
        accounts.length > 0 ? accounts[0] : ""
      );
    };

    checkWalletConnection();

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    return () => {
      window.ethereum?.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          <span className="logoIcon">◆</span>
          BlockVault
        </div>

        <div className="navLinks">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#upload">Upload</a>
        </div>

        <button
          className="walletButton"
          onClick={connectWallet}
        >
          {walletAddress
            ? `${walletAddress.slice(
                0,
                6
              )}...${walletAddress.slice(-4)}`
            : "Connect MetaMask"}
        </button>
      </nav>

      <main id="home" className="hero">
        <div className="heroContent">
          <div className="tag">
            BLOCKCHAIN • IPFS • ENCRYPTION
          </div>

          <h1>
            Secure your files with
            <span>
              {" "}
              decentralized technology.
            </span>
          </h1>

          <p>
            Encrypt, upload and share files securely
            using Blockchain, IPFS and smart-contract
            based access control.
          </p>

          <div className="heroButtons">
            <a
              href="#upload"
              className="primaryButton"
            >
              Upload Securely
            </a>

            <a
              href="#features"
              className="secondaryButton"
            >
              Explore Features
            </a>
          </div>

          <div className="stats">
            <div>
              <strong>100%</strong>
              <small>Decentralized</small>
            </div>

            <div>
              <strong>AES</strong>
              <small>Encrypted</small>
            </div>

            <div>
              <strong>24/7</strong>
              <small>Available</small>
            </div>
          </div>
        </div>

        <div className="vaultCard">
          <div className="cardGlow"></div>
          <div className="shield">⬡</div>

          <h2>Your Digital Vault</h2>

          <p>
            Protected through encryption and blockchain
            technology.
          </p>

          <div className="securityItem">
            <span>✓</span>
            AES File Encryption
          </div>

          <div className="securityItem">
            <span>✓</span>
            Decentralized IPFS Storage
          </div>

          <div className="securityItem">
            <span>✓</span>
            Smart Contract Access
          </div>

          <div className="status">
            <span className="statusDot"></span>
            System secured
          </div>
        </div>
      </main>

      <section
        id="upload"
        className="uploadSection"
      >
        <div className="uploadHeading">
          <div>
            <span className="tag">
              SECURE UPLOAD
            </span>

            <h2>Upload a file to BlockVault</h2>

            <p>
              Select a file, provide the recipient wallet
              address and set an access-expiry time.
            </p>
          </div>

          <div className="connectedWallet">
            <span
              className={
                walletAddress
                  ? "onlineDot"
                  : "offlineDot"
              }
            ></span>

            {walletAddress
              ? `${walletAddress.slice(
                  0,
                  8
                )}...${walletAddress.slice(-6)}`
              : "Wallet not connected"}
          </div>
        </div>

        <div className="uploadDashboard">
          <div className="uploadBox">
            <label
              htmlFor="fileInput"
              className="dropZone"
            >
              <div className="uploadIcon">↑</div>

              <h3>
                {selectedFile
                  ? selectedFile.name
                  : "Choose a file to encrypt"}
              </h3>

              <p>
                {selectedFile
                  ? `${(
                      selectedFile.size / 1024
                    ).toFixed(2)} KB`
                  : "Click here to browse files"}
              </p>

              <input
                id="fileInput"
                type="file"
                hidden
                onChange={(event) =>
                  setSelectedFile(
                    event.target.files?.[0] ||
                      null
                  )
                }
              />
            </label>
          </div>

          <div className="uploadForm">
            <label>
              Recipient wallet address
            </label>

            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(event) =>
                setRecipient(event.target.value)
              }
            />

            <button
              type="button"
              className="useWalletButton"
              onClick={() =>
                setRecipient(walletAddress)
              }
              disabled={!walletAddress}
            >
              Use My Connected Wallet
            </button>

            <label>Access expiry</label>

            <input
              type="datetime-local"
              value={expiry}
              onChange={(event) =>
                setExpiry(event.target.value)
              }
            />

            <button
              className="encryptButton"
              disabled={
                !walletAddress ||
                !selectedFile ||
                !recipient ||
                !expiry
              }
              onClick={encryptSelectedFile}
            >
              Encrypt & Upload
            </button>

            {uploadStatus && (
              <p
                className={
                  transactionHash
                    ? "successMessage"
                    : "processingMessage"
                }
              >
                {uploadStatus}
              </p>
            )}

            {ipfsCid && (
              <div className="cidResult">
                <strong>IPFS CID</strong>
                <span>{ipfsCid}</span>

                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      ipfsCid
                    )
                  }
                >
                  Copy CID
                </button>
              </div>
            )}

            {transactionHash && (
              <div className="cidResult">
                <strong>
                  Sepolia Transaction
                </strong>

                <span>{transactionHash}</span>

                <a
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Etherscan
                </a>
              </div>
            )}

            {!walletAddress && (
              <p className="formMessage">
                Upload cheyyadaniki mundu
                MetaMask connect cheyyandi.
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="features"
      >
        <h2>Everything your files need</h2>

        <p className="sectionText">
          Modern security powered by
          decentralized technologies.
        </p>

        <div className="featureGrid">
          <article className="featureCard">
            <div className="featureIcon">
              🔐
            </div>
            <h3>AES Encryption</h3>
            <p>
              Your files are encrypted before leaving
              your device.
            </p>
          </article>

          <article className="featureCard">
            <div className="featureIcon">
              🌐
            </div>
            <h3>IPFS Storage</h3>
            <p>
              Encrypted files are stored across a
              decentralized network.
            </p>
          </article>

          <article className="featureCard">
            <div className="featureIcon">
              ⛓️
            </div>
            <h3>Blockchain Access</h3>
            <p>
              Smart contracts securely manage
              permissions and ownership.
            </p>
          </article>
        </div>
      </section>

      <footer>
        <div className="logo">
          ◆ BlockVault
        </div>

        <p>
          Secure File Sharing Using Blockchain & IPFS
        </p>
      </footer>
    </div>
  );
}

export default App;