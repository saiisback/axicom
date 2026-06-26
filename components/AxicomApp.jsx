"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Droplets,
  ExternalLink,
  Network,
  Search,
  Send,
  Shield,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const TOKEN = "0x88C13F1EDdBa38f7e03835fd7ACe1a8bdebcc3E6";
const FHERC20 = "0xA67bA7639ebFcF114FE4a641D080FA395B0BA89F";
const FAUCET = "0xB43188779646ED481a5187dBE1DdbAE94B048533";
const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_HEX = "0xaa36a7";

const DEPLOY_TOKEN_TX = "0x53e603d1b4f17b423863254c3d7f1dc9763786c00206f02009f2fd9f62307ae6";
const DEPLOY_FHERC20_TX = "0x329ec85a22758fe11ad565ed5730a973ad436b5b612350a5f24cc5b6748435a8";
const FAUCET_DEPLOY_TX = "0xec660f7b69ee593d528cdfc24f5063130ef610e2e925118e44aa3334d0386c74";
const FAUCET_FUND_TX = "0x42945948d71804bebde635e9a2405c4a2534e741a09621350334515a8fad85a0";

const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_HEX,
  chainName: "Ethereum Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://ethereum-sepolia.publicnode.com"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

const ERC20_ABI = [
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
];

const FHERC20_ABI = ["function shield(address to,uint256 amount) returns (bytes32)"];
const FAUCET_ABI = ["function claim()"];

const heroBrands = [
  ["Arbitrum", { fontFamily: "Georgia, serif", fontWeight: 700, letterSpacing: "-0.02em", fontSize: 15 }],
  ["Fhenix", { fontFamily: "Arial, sans-serif", fontWeight: 900, letterSpacing: "0.08em", fontSize: 13, textTransform: "uppercase" }],
  ["CoFHE", { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, letterSpacing: "0.01em", fontSize: 15, fontStyle: "italic" }],
  ["MetaMask", { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.12em", fontSize: 13, textTransform: "uppercase" }],
  ["Sepolia", { fontFamily: "Palatino, 'Book Antiqua', serif", fontWeight: 400, letterSpacing: "-0.01em", fontSize: 16 }],
  ["FHERC20", { fontFamily: "Impact, 'Arial Narrow', sans-serif", fontWeight: 400, letterSpacing: "0.04em", fontSize: 14 }],
  ["Etherscan", { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "-0.03em", fontSize: 13 }],
];

const backers = [
  ["Private Pools", { fontFamily: "'Times New Roman', serif", fontWeight: 400, letterSpacing: "0.02em", fontSize: 14 }],
  ["Encrypted", { fontFamily: "'Arial Black', sans-serif", fontWeight: 900, letterSpacing: "0.08em", fontSize: 16 }],
  ["FHERC20", { fontFamily: "Impact, sans-serif", fontWeight: 700, letterSpacing: "0.05em", fontSize: 18 }],
  ["CoFHE", { fontFamily: "Georgia, serif", fontWeight: 600, letterSpacing: "-0.02em", fontSize: 17 }],
  ["Shielded UX", { fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700, letterSpacing: "-0.01em", fontSize: 15 }],
  ["TESTNET", { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "0.06em", fontSize: 14, textTransform: "uppercase" }],
  ["No Private Keys", { fontFamily: "'Courier New', monospace", fontWeight: 700, letterSpacing: "0.18em", fontSize: 14 }],
  ["MetaMask", { fontFamily: "Palatino, serif", fontWeight: 500, letterSpacing: "0.03em", fontSize: 15 }],
];

function LogoIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
    </svg>
  );
}

function short(value) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Open Wallet";
}

function explorer(kind, value) {
  return `https://sepolia.etherscan.io/${kind}/${value}`;
}

function Marquee({ items, className = "", trackClass = "marquee-track" }) {
  const repeated = [...items, ...items];
  return (
    <div className={`marquee ${className}`}>
      <div className={trackClass}>
        {repeated.map(([label, style], index) => (
          <span key={`${label}-${index}`} style={style}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

async function getMetaMaskProvider() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const discovered = [];
  function onProvider(event) {
    if (event.detail?.provider) discovered.push(event.detail);
  }

  window.addEventListener("eip6963:announceProvider", onProvider);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((resolve) => setTimeout(resolve, 80));
  window.removeEventListener("eip6963:announceProvider", onProvider);

  const eip6963MetaMask = discovered.find((item) => {
    const rdns = item.info?.rdns?.toLowerCase() || "";
    const name = item.info?.name?.toLowerCase() || "";
    return rdns.includes("metamask") || name.includes("metamask");
  });
  const injectedProviders = window.ethereum.providers || [];
  const injectedMetaMask = injectedProviders.find((provider) => provider.isMetaMask);
  const rawProvider = eip6963MetaMask?.provider || injectedMetaMask || (window.ethereum.isMetaMask ? window.ethereum : null);

  if (!rawProvider) throw new Error("MetaMask not found. Enable MetaMask for this site.");
  return { rawProvider, provider: new BrowserProvider(rawProvider) };
}

export default function AxicomApp() {
  const [panel, setPanel] = useState("send");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [receiver, setReceiver] = useState("");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!status && !txHash) return;
    setToastOpen(true);
    const timer = window.setTimeout(() => setToastOpen(false), txHash ? 12000 : 5200);
    return () => window.clearTimeout(timer);
  }, [status, txHash]);

  async function addOrSwitchSepolia() {
    const { rawProvider, provider } = await getMetaMaskProvider();
    try {
      await rawProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_HEX }],
      });
    } catch (switchError) {
      if (switchError?.code !== 4902) throw switchError;
      await rawProvider.request({
        method: "wallet_addEthereumChain",
        params: [SEPOLIA_PARAMS],
      });
    }
    return { rawProvider, provider };
  }

  async function addSepoliaRpc() {
    try {
      await addOrSwitchSepolia();
      setStatus("Ethereum Sepolia RPC added or selected in MetaMask.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function connect() {
    try {
      const { rawProvider, provider } = await addOrSwitchSepolia();
      const accounts = await rawProvider.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setReceiver((current) => current || accounts[0]);
      const network = await provider.getNetwork();
      setStatus(`Connected on chain ${network.chainId.toString()}`);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function addTokenToWallet(kind = "fherc20") {
    try {
      const { rawProvider } = await addOrSwitchSepolia();
      const isShielded = kind === "fherc20";
      await rawProvider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: isShielded ? FHERC20 : TOKEN,
            symbol: isShielded ? "fheAX" : "axUSDC",
            decimals: 6,
          },
        },
      });
      setStatus(isShielded ? "Added fheAX indicator token to MetaMask." : "Added axUSDC token to MetaMask.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function requireSepoliaSigner() {
    const { provider } = await getMetaMaskProvider();
    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) throw new Error("Switch MetaMask to Ethereum Sepolia first.");
    return provider.getSigner();
  }

  async function sendShielded() {
    setBusy(true);
    setTxHash("");
    try {
      const signer = await requireSepoliaSigner();
      const sender = await signer.getAddress();
      const destination = receiver || sender;
      const token = new Contract(TOKEN, ERC20_ABI, signer);
      const wrapper = new Contract(FHERC20, FHERC20_ABI, signer);
      const decimals = Number(await token.decimals());
      const baseUnits = parseUnits(amount, decimals);

      const allowance = await token.allowance(sender, FHERC20);
      if (allowance < baseUnits) {
        setStatus("Approving token");
        const approveTx = await token.approve(FHERC20, baseUnits);
        await approveTx.wait();
      }

      setStatus("Sending shielded FHERC20");
      const shieldTx = await wrapper.shield(destination, baseUnits);
      setTxHash(shieldTx.hash);
      await shieldTx.wait();
      setStatus("Shielded transfer complete");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function claimFaucet() {
    setBusy(true);
    setTxHash("");
    try {
      const signer = await requireSepoliaSigner();
      const faucet = new Contract(FAUCET, FAUCET_ABI, signer);
      setStatus("Claiming test FHERC20");
      const claimTx = await faucet.claim();
      setTxHash(claimTx.hash);
      await claimTx.wait();
      setStatus("Faucet sent test FHERC20");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="hero-shell" id="send">
        <nav className="navbar">
          <div className="nav-inner">
            <a className="brand" href="#send" aria-label="Axicom home">
              <LogoIcon className="logo-icon" />
              <span>Axicom</span>
            </a>

            <div className="nav-links">
              <button onClick={() => setPanel("send")}>Send Money</button>
              <button onClick={() => setPanel("explorer")}>Block Explorer</button>
              <button onClick={() => setPanel("faucet")}>Faucet</button>
              <a href="#learn">Network</a>
              <a href="#modes">Use Cases</a>
              <a href="/docs">Docs</a>
            </div>

            <button className="black-pill" onClick={connect}>
              <Wallet size={18} />
              {short(account)}
            </button>
          </div>
        </nav>

        <div className="hero-wrap">
          <div className="hero-card">
            <video
              className="hero-video"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="hero-content">
              <div className="hero-copy">
                <p className="eyebrow">Private liquidity for FHERC20</p>
                <h1>
                  Your liquidity
                  <br />
                  stays shielded
                </h1>
                <p>
                  Axicom routes test liquidity into encrypted FHERC20 balances so users can send value without exposing the private balance layer.
                </p>
                <button className="join-pill" onClick={() => setPanel("send")}>
                  Send now
                  <span>
                    <ArrowRight size={20} />
                  </span>
                </button>
                <Marquee items={heroBrands} className="hero-marquee" />
              </div>

              <div className="action-card">
                <div className="panel-tabs">
                  <button className={panel === "send" ? "active" : ""} onClick={() => setPanel("send")}>
                    <Send size={16} />
                    Send
                  </button>
                  <button className={panel === "explorer" ? "active" : ""} onClick={() => setPanel("explorer")}>
                    <Search size={16} />
                    Explorer
                  </button>
                  <button className={panel === "faucet" ? "active" : ""} onClick={() => setPanel("faucet")}>
                    <Droplets size={16} />
                    Faucet
                  </button>
                </div>

                {panel === "send" && (
                  <div className="panel-body">
                    <label>
                      Amount
                      <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
                    </label>
                    <label>
                      Receiver
                      <input
                        className="address-input"
                        value={receiver}
                        onChange={(event) => setReceiver(event.target.value)}
                        onFocus={(event) => event.currentTarget.select()}
                        placeholder="0x..."
                        spellCheck="false"
                      />
                    </label>
                    <button className="primary-action" onClick={sendShielded} disabled={busy}>
                      <Send size={18} />
                      {busy ? "Sending..." : "Send shielded"}
                    </button>
                    <div className="wallet-tools">
                      <button type="button" onClick={addSepoliaRpc}>
                        <Network size={15} />
                        Add Sepolia RPC
                      </button>
                      <button type="button" onClick={() => addTokenToWallet("fherc20")}>
                        <Zap size={15} />
                        Add fheAX
                      </button>
                      <button type="button" onClick={() => addTokenToWallet("token")}>
                        <CircleDollarSign size={15} />
                        Add axUSDC
                      </button>
                    </div>
                  </div>
                )}

                {panel === "explorer" && (
                  <div className="panel-body link-panel">
                    <a href={explorer("address", FHERC20)} target="_blank" rel="noreferrer"><ExternalLink size={15} />FHERC20 wrapper</a>
                    <a href={explorer("address", TOKEN)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Backing token</a>
                    <a href={explorer("address", FAUCET)} target="_blank" rel="noreferrer"><ExternalLink size={15} />FHERC20 faucet</a>
                    <a href={explorer("tx", DEPLOY_TOKEN_TX)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Token deploy tx</a>
                    <a href={explorer("tx", DEPLOY_FHERC20_TX)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Wrapper deploy tx</a>
                    <a href={explorer("tx", FAUCET_DEPLOY_TX)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Faucet deploy tx</a>
                    <a href={explorer("tx", FAUCET_FUND_TX)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Faucet fund tx</a>
                  </div>
                )}

                {panel === "faucet" && (
                  <div className="panel-body faucet-panel">
                    <span>Test faucet</span>
                    <strong>0.01 fheAX</strong>
                    <p>Claim test FHERC20 for your connected wallet, then add the token to MetaMask.</p>
                    <button className="primary-action" onClick={claimFaucet} disabled={busy}>
                      <Droplets size={18} />
                      {busy ? "Claiming..." : "Claim test FHERC20"}
                    </button>
                    <button onClick={addSepoliaRpc}><Network size={17} />Add Sepolia RPC</button>
                    <button onClick={() => addTokenToWallet("fherc20")}><Zap size={17} />Add fheAX to MetaMask</button>
                    <button onClick={() => addTokenToWallet("token")}><CircleDollarSign size={17} />Add axUSDC to MetaMask</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="info-section" id="learn">
        <div className="section-inner">
          <div className="intro-grid">
            <div>
              <h2>Meet Axicom.</h2>
              <button className="join-pill dark" onClick={() => setPanel("explorer")}>
                Discover it
                <span>
                  <ArrowRight size={18} />
                </span>
              </button>
            </div>
            <p>
              Axicom is a shielded FHERC20 liquidity interface for moving testnet value into private balances while keeping the wallet signing flow simple and MetaMask-native.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card image-card">
              <h3>Liquidity that blooms</h3>
              <p>Send ERC20-backed test liquidity into FHERC20 balances and confirm every step on Sepolia.</p>
            </article>
            <article className="feature-card dark-card">
              <Shield size={28} />
              <h3>
                Private by
                <br />
                construction.
              </h3>
              <p>Balances live behind CoFHE-style encrypted contract flows instead of a plain public balance UX.</p>
            </article>
            <article className="feature-card dark-card">
              <Zap size={28} />
              <h3>
                Faucet
                <br />
                ready.
              </h3>
              <p>Generate test FHERC20 and add the token plus Sepolia RPC directly to MetaMask.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="backed-section">
        <div className="section-inner backed-grid">
          <p>
            Built around public testnet contracts
            <br />
            and private-balance UX primitives.
          </p>
          <Marquee items={backers} trackClass="backers-track" />
        </div>
      </section>

      <section className="use-section" id="modes">
        <div className="section-inner use-grid">
          <div className="use-copy">
            <p>Axicom in practice</p>
            <h2>Use modes</h2>
            <span>
              Axicom gives builders, wallets, and demos a cleaner way to show private pool funding, token watch flows, and transaction proofing without private keys in the app.
            </span>
          </div>

          <article className="use-card">
            <video
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            <div>
              <h3>Shielded transfers</h3>
              <p>
                Let users choose an amount and receiver, approve the backing token, and push liquidity into the FHERC20 wrapper from one polished wallet surface.
              </p>
              <button className="know-more" onClick={() => setPanel("send")}>
                <span>
                  <ArrowRight size={16} />
                </span>
                Know more
              </button>
            </div>
          </article>
        </div>
      </section>

      {toastOpen && (status || txHash) && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 className="toast-icon" size={20} />
          <div className="toast-copy">
            <strong>{txHash ? "Transaction update" : "Wallet update"}</strong>
            <span>{status}</span>
          </div>
          {txHash && <a href={explorer("tx", txHash)} target="_blank" rel="noreferrer"><ExternalLink size={14} />View tx</a>}
          <button className="toast-close" type="button" onClick={() => setToastOpen(false)} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      )}
    </main>
  );
}
