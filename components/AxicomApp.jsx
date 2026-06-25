"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import {
  CheckCircle2,
  CircleDollarSign,
  Droplets,
  ExternalLink,
  Network,
  Search,
  Send,
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
const tabs = ["Send Money", "Block Explorer", "Faucet"];
const tabIcons = {
  "Send Money": Send,
  "Block Explorer": Search,
  Faucet: Droplets,
};

function short(value) {
  return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "Connect wallet";
}

function explorer(kind, value) {
  return `https://sepolia.etherscan.io/${kind}/${value}`;
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
  const [tab, setTab] = useState("Send Money");
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
    <main className="shell">
      <section className="stage">
        <nav className="glass">
          <div className="brand">
            <span className="leaf" />
            <strong>Axicom</strong>
          </div>
          <div className="nav-links glass">
            {tabs.map((item) => {
              const Icon = tabIcons[item];
              return (
                <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
                  <Icon size={16} strokeWidth={2.4} />
                  {item}
                </button>
              );
            })}
          </div>
          <button className="nav-cta glass" onClick={connect}>
            <Wallet size={17} strokeWidth={2.4} />
            {short(account)}
          </button>
        </nav>

        <div className="hero-content">
          <div className="copy glass">
            <p className="eyebrow">CoFHE private balances</p>
            <h1>{tab === "Faucet" ? "Generate test FHERC20 privately" : "Send liquidity into a shielded FHERC20 balance"}</h1>
          </div>

          {tab === "Send Money" && (
            <div className="transfer-box glass">
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
              <button onClick={sendShielded} disabled={busy}>
                <Send size={17} strokeWidth={2.4} />
                {busy ? "Sending..." : "Send shielded"}
              </button>
              <div className="wallet-tools">
                <button type="button" onClick={addSepoliaRpc}>
                  <Network size={14} strokeWidth={2.4} />
                  Add Sepolia RPC
                </button>
                <button type="button" onClick={() => addTokenToWallet("fherc20")}>
                  <Zap size={14} strokeWidth={2.4} />
                  Add fheAX
                </button>
                <button type="button" onClick={() => addTokenToWallet("token")}>
                  <CircleDollarSign size={14} strokeWidth={2.4} />
                  Add axUSDC
                </button>
              </div>
            </div>
          )}

          {tab === "Block Explorer" && (
            <div className="transfer-box glass link-panel">
              <a href={explorer("address", FHERC20)} target="_blank" rel="noreferrer"><ExternalLink size={15} />FHERC20 wrapper</a>
              <a href={explorer("address", TOKEN)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Backing token</a>
              <a href={explorer("address", FAUCET)} target="_blank" rel="noreferrer"><ExternalLink size={15} />FHERC20 faucet</a>
              <a href={explorer("tx", DEPLOY_TOKEN_TX)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Token deploy tx</a>
              <a href={explorer("tx", DEPLOY_FHERC20_TX)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Wrapper deploy tx</a>
              <a href={explorer("tx", FAUCET_DEPLOY_TX)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Faucet deploy tx</a>
              <a href={explorer("tx", FAUCET_FUND_TX)} target="_blank" rel="noreferrer"><ExternalLink size={15} />Faucet fund tx</a>
            </div>
          )}

          {tab === "Faucet" && (
            <div className="transfer-box glass">
              <div className="faucet-copy">
                <span>Test faucet</span>
                <strong>0.01 fheAX</strong>
                <p>The faucet shields backing ERC20 into FHERC20 for your connected wallet.</p>
              </div>
              <button onClick={claimFaucet} disabled={busy}>
                <Droplets size={17} strokeWidth={2.4} />
                {busy ? "Claiming..." : "Claim test FHERC20"}
              </button>
              <button onClick={addSepoliaRpc}><Network size={17} strokeWidth={2.4} />Add Sepolia RPC</button>
              <button onClick={() => addTokenToWallet("fherc20")}><Zap size={17} strokeWidth={2.4} />Add fheAX to MetaMask</button>
              <button onClick={() => addTokenToWallet("token")}><CircleDollarSign size={17} strokeWidth={2.4} />Add axUSDC to MetaMask</button>
            </div>
          )}
        </div>

        {toastOpen && (status || txHash) && (
          <div className="toast glass" role="status" aria-live="polite">
            <CheckCircle2 className="toast-icon" size={20} strokeWidth={2.4} />
            <div className="toast-copy">
              <strong>{txHash ? "Transaction update" : "Wallet update"}</strong>
              <span>{status}</span>
            </div>
            {txHash && <a href={explorer("tx", txHash)} target="_blank" rel="noreferrer"><ExternalLink size={14} />View tx</a>}
            <button className="toast-close" type="button" onClick={() => setToastOpen(false)} aria-label="Dismiss notification">
              <X size={14} strokeWidth={2.6} />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
