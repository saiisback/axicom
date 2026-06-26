import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

const APP_URL = "http://127.0.0.1:5173";
const NETWORK_NAME = "Ethereum Sepolia";
const CHAIN_ID = "11155111";
const CHAIN_HEX = "0xaa36a7";
const RPC_URL = "https://ethereum-sepolia.publicnode.com";
const EXPLORER_URL = "https://sepolia.etherscan.io";

const ADDRESSES = {
  backingToken: "0x88C13F1EDdBa38f7e03835fd7ACe1a8bdebcc3E6",
  fherc20: "0xA67bA7639ebFcF114FE4a641D080FA395B0BA89F",
  faucet: "0xB43188779646ED481a5187dBE1DdbAE94B048533",
};

const TXS = {
  backingTokenDeploy: "0x53e603d1b4f17b423863254c3d7f1dc9763786c00206f02009f2fd9f62307ae6",
  fherc20Deploy: "0x329ec85a22758fe11ad565ed5730a973ad436b5b612350a5f24cc5b6748435a8",
  faucetDeploy: "0xec660f7b69ee593d528cdfc24f5063130ef610e2e925118e44aa3334d0386c74",
  faucetFund: "0x42945948d71804bebde635e9a2405c4a2534e741a09621350334515a8fad85a0",
};

const navItems = [
  ["Overview", "overview"],
  ["Architecture", "architecture"],
  ["Deployments", "deployments"],
  ["User Flow", "flow"],
  ["FHE Model", "privacy-model"],
  ["Pool Impact", "pool-impact"],
  ["Use Cases", "use-cases"],
  ["Testing", "testing"],
  ["Edge Cases", "edge-cases"],
  ["Production Path", "production"],
];

const explorer = (kind, value) => `${EXPLORER_URL}/${kind}/${value}`;

export const metadata = {
  title: "Axicom Documentation",
  description: "Technical documentation for Axicom shielded FHERC20 liquidity pools.",
};

function ExternalRow({ label, href, value }) {
  return (
    <a className="doc-link-row" href={href} target="_blank" rel="noreferrer">
      <span>{label}</span>
      <code>{value}</code>
      <ExternalLink size={16} />
    </a>
  );
}

function Callout({ title, children }) {
  return (
    <aside className="docs-callout">
      <strong>{title}</strong>
      <p>{children}</p>
    </aside>
  );
}

export default function DocsPage() {
  return (
    <main className="docs-page docs-manual-page">
      <nav className="docs-nav">
        <Link className="docs-back" href="/">
          <ArrowLeft size={18} />
          Axicom
        </Link>
        <div className="docs-nav-actions">
          <a className="docs-pill ghost" href={APP_URL}>
            Open App
          </a>
          <a className="docs-pill" href="https://cofhe-docs.fhenix.zone/" target="_blank" rel="noreferrer">
            CoFHE Docs
            <ExternalLink size={15} />
          </a>
        </div>
      </nav>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-sidebar-card">
            <p>Axicom Docs</p>
            {navItems.map(([label, id]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </div>
        </aside>

        <article className="docs-content">
          <header className="docs-manual-hero" id="overview">
            <p className="eyebrow">Product and technical documentation</p>
            <h1>Axicom shielded liquidity pools</h1>
            <p>
              Axicom is a Next.js application that presents a polished, wallet-native interface for sending test liquidity into an FHERC20-style shielded balance flow.
              The product is built to explain how confidential token accounting can become a user-facing liquidity primitive for Fhenix and CoFHE applications.
            </p>
          </header>

          <section className="manual-section">
            <h2>What the application does</h2>
            <p>
              The app lets a user connect MetaMask, switch to Ethereum Sepolia, add the relevant token contracts to their wallet, claim test FHERC20 through a faucet flow,
              and send a shielded transfer to a receiver address. Under the hood, the current deployed flow uses a public backing token and an FHERC20 wrapper contract.
              The user experience is deliberately simple because the point of the product is to hide the complexity of confidential token infrastructure behind a familiar
              fintech-style wallet action.
            </p>
            <p>
              In the long-term Fhenix version, this same interface maps cleanly onto the real target flow: liquidity arrives from a source chain such as Arbitrum, is accepted
              by a bridge receiver on Fhenix, is wrapped or minted into an FHERC20 representation, and then becomes usable inside shielded liquidity pools whose sensitive
              accounting is handled with FHE-enabled smart contracts.
            </p>
            <Callout title="Important privacy framing">
              Axicom does not claim that every network-level trace disappears. Public chains still reveal transaction submission, contract addresses, and timing metadata.
              The FHE-aligned value is that sensitive balances and pool accounting can be represented as encrypted state instead of plain readable contract storage.
            </Callout>
          </section>

          <section className="manual-section" id="architecture">
            <h2>Architecture</h2>
            <p>
              Axicom separates the UX into three layers: wallet operations, public settlement, and confidential accounting. The wallet layer is MetaMask-only and never asks
              for private keys. The settlement layer is currently Ethereum Sepolia so the team can inspect all contract addresses and transaction hashes on Etherscan. The
              confidential accounting layer is represented by the FHERC20 wrapper flow, which is the interface boundary where public ERC20 liquidity becomes shielded balance.
            </p>
            <div className="architecture-flow">
              <span>MetaMask user</span>
              <span>Sepolia ERC20</span>
              <span>approve</span>
              <span>FHERC20 wrapper</span>
              <span>shielded balance</span>
              <span>pool accounting</span>
            </div>
            <h3>Current deployed flow</h3>
            <ol>
              <li>User connects MetaMask and the app requests Ethereum Sepolia.</li>
              <li>User optionally adds Sepolia RPC, fheAX, and axUSDC to MetaMask using wallet APIs.</li>
              <li>User claims test FHERC20 from the faucet or prepares backing token liquidity.</li>
              <li>User enters amount and receiver address.</li>
              <li>If allowance is missing, the app sends an ERC20 approval transaction.</li>
              <li>The app calls the FHERC20 wrapper shield function for the receiver.</li>
              <li>The app surfaces a transaction hash so the user can verify the transaction on Sepolia Etherscan.</li>
            </ol>
            <h3>Target cross-chain flow</h3>
            <p>
              For the full product vision, the source chain can be Arbitrum or another EVM chain. Liquidity moves through a bridge or messaging system, then lands on Fhenix
              where a receiver contract validates the message, mints or unlocks the canonical representation, and deposits into the appropriate shielded pool. The receiver
              must verify origin chain, origin sender, token identity, destination pool, nonce, amount, and replay state before releasing or minting the FHERC20 asset.
            </p>
          </section>

          <section className="manual-section" id="deployments">
            <h2>Deployments and URLs</h2>
            <p>
              The current public proof points are on Ethereum Sepolia. These links are useful for a Fhenix review because they show which contracts exist, which transactions
              deployed or funded them, and where a tester can verify the result of the UI actions.
            </p>
            <div className="docs-kv-grid">
              <div><span>Network</span><strong>{NETWORK_NAME}</strong></div>
              <div><span>Chain ID</span><strong>{CHAIN_ID}</strong></div>
              <div><span>Hex Chain ID</span><strong>{CHAIN_HEX}</strong></div>
              <div><span>RPC</span><strong>{RPC_URL}</strong></div>
            </div>
            <div className="docs-list">
              <ExternalRow label="Application" href={APP_URL} value={APP_URL} />
              <ExternalRow label="Explorer" href={EXPLORER_URL} value={EXPLORER_URL} />
              <ExternalRow label="Backing token axUSDC" href={explorer("address", ADDRESSES.backingToken)} value={ADDRESSES.backingToken} />
              <ExternalRow label="FHERC20 wrapper fheAX" href={explorer("address", ADDRESSES.fherc20)} value={ADDRESSES.fherc20} />
              <ExternalRow label="FHERC20 faucet" href={explorer("address", ADDRESSES.faucet)} value={ADDRESSES.faucet} />
              <ExternalRow label="Backing token deploy tx" href={explorer("tx", TXS.backingTokenDeploy)} value={TXS.backingTokenDeploy} />
              <ExternalRow label="FHERC20 deploy tx" href={explorer("tx", TXS.fherc20Deploy)} value={TXS.fherc20Deploy} />
              <ExternalRow label="Faucet deploy tx" href={explorer("tx", TXS.faucetDeploy)} value={TXS.faucetDeploy} />
              <ExternalRow label="Faucet funding tx" href={explorer("tx", TXS.faucetFund)} value={TXS.faucetFund} />
            </div>
          </section>

          <section className="manual-section" id="flow">
            <h2>User flow</h2>
            <p>
              The app is designed so a non-technical reviewer can walk through the whole money path without touching a terminal. Each action maps to a wallet request or a
              contract transaction.
            </p>
            <div className="manual-steps">
              <article>
                <span>01</span>
                <h3>Open wallet</h3>
                <p>Click Open Wallet. The app selects MetaMask using EIP-6963/injected provider detection, then requests accounts.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Add network and tokens</h3>
                <p>Use Add Sepolia RPC, Add fheAX, and Add axUSDC. These buttons help wallet visibility but do not custody funds.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Claim or prepare liquidity</h3>
                <p>Use the Faucet panel to obtain test FHERC20. For wrapper sends, the connected wallet also needs backing token balance and Sepolia ETH for gas.</p>
              </article>
              <article>
                <span>04</span>
                <h3>Send shielded</h3>
                <p>Enter amount and receiver. The app handles approval first when needed, then submits the shield transaction.</p>
              </article>
              <article>
                <span>05</span>
                <h3>Verify</h3>
                <p>The toast and Block Explorer panel expose transaction hashes and contract links for Etherscan verification.</p>
              </article>
            </div>
          </section>

          <section className="manual-section" id="privacy-model">
            <h2>FHE privacy model</h2>
            <p>
              Fully Homomorphic Encryption lets smart-contract systems compute over encrypted values. In a token or pool context, that means balances, internal pool
              allocations, contribution sizes, or reward calculations can be represented without exposing the raw values in public contract storage. This matters because
              liquidity applications often need public settlement guarantees while keeping commercial strategy, participant balances, or pool composition confidential.
            </p>
            <h3>What should be confidential</h3>
            <ul>
              <li>Per-user shielded balance inside the pool.</li>
              <li>Private pool accounting such as exact participant contribution sizes.</li>
              <li>Internal allocation decisions for treasury or strategy-managed liquidity.</li>
              <li>Reward, fee, or distribution calculations that should not reveal sensitive inputs.</li>
            </ul>
            <h3>What remains visible</h3>
            <ul>
              <li>The user still submits a transaction from an address unless a separate relayer/account-abstraction layer is added.</li>
              <li>Contract addresses and call timing remain visible on the public network.</li>
              <li>Bridge events may reveal source-chain movement unless the bridge layer also has privacy protections.</li>
              <li>Wallet-side token watch actions are purely display actions and are not privacy primitives.</li>
            </ul>
          </section>

          <section className="manual-section" id="pool-impact">
            <h2>How shielded pools affect liquidity</h2>
            <p>
              A standard public pool exposes most useful signals: who funded it, when they entered, how much they moved, when they withdrew, and sometimes the rough strategy
              or destination. That transparency is useful for auditability but can be bad for institutions, market makers, treasuries, or users who do not want every balance
              movement copied, profiled, or traded against.
            </p>
            <p>
              A shielded pool keeps the settlement guarantees of a blockchain while reducing unnecessary disclosure. The pool can still enforce deposits, withdrawals, and
              accounting rules, but values that do not need to be public can remain encrypted. For Fhenix, this is a strong application category because liquidity pools are
              valuable, easy to understand, and naturally benefit from confidential state.
            </p>
            <div className="docs-kv-grid">
              <div><span>Better for users</span><strong>Balance privacy</strong></div>
              <div><span>Better for treasuries</span><strong>Strategy privacy</strong></div>
              <div><span>Better for markets</span><strong>Less copy-trading</strong></div>
              <div><span>Better for builders</span><strong>New pool designs</strong></div>
            </div>
          </section>

          <section className="manual-section" id="use-cases">
            <h2>FHE-aligned use cases</h2>
            <div className="use-case-list">
              <article>
                <h3>Private liquidity bootstrapping</h3>
                <p>Teams can seed liquidity without exposing every contributor, exact contribution amount, or internal pool composition.</p>
              </article>
              <article>
                <h3>Confidential treasury routing</h3>
                <p>DAOs and companies can route capital between strategies while keeping sensitive allocation sizes encrypted.</p>
              </article>
              <article>
                <h3>Private reward distribution</h3>
                <p>Rewards can be calculated from encrypted balances or contribution weights, reducing public leakage of user activity.</p>
              </article>
              <article>
                <h3>Institutional DeFi access</h3>
                <p>Institutions can participate in on-chain liquidity with fewer concerns about exposing operating balances or trading intent.</p>
              </article>
              <article>
                <h3>Payroll, grants, and contributor pools</h3>
                <p>Organizations can fund a pool and distribute value without making every recipient amount part of a public dashboard.</p>
              </article>
              <article>
                <h3>Cross-chain private liquidity</h3>
                <p>Liquidity can originate on a familiar EVM chain, then become confidential once it is accepted into a Fhenix pool.</p>
              </article>
            </div>
          </section>

          <section className="manual-section" id="testing">
            <h2>Testing guide</h2>
            <ol>
              <li>Open the app at <code>{APP_URL}</code>.</li>
              <li>Connect MetaMask and approve the Sepolia network switch.</li>
              <li>Click Add Sepolia RPC if the wallet does not already have the network configured.</li>
              <li>Click Add fheAX and Add axUSDC so the wallet can display both token contracts.</li>
              <li>Open Faucet and claim test FHERC20.</li>
              <li>Open Send Money, enter an amount, and set the receiver address.</li>
              <li>Approve the backing token if MetaMask prompts for approval.</li>
              <li>Confirm the shielded send transaction.</li>
              <li>Open the toast transaction link or the Block Explorer panel to verify the chain transaction.</li>
            </ol>
            <Callout title="No private key required">
              The browser app should never ask for a private key. MetaMask signs transactions locally. For Vercel, only public contract addresses and optional public RPC URLs
              belong in NEXT_PUBLIC environment variables.
            </Callout>
          </section>

          <section className="manual-section" id="edge-cases">
            <h2>End-to-end edge cases</h2>
            <div className="edge-grid manual-edge-grid">
              <article>
                <h3>No MetaMask installed</h3>
                <p>The app throws a clear MetaMask-not-found message. It does not fall back to Trust Wallet or another injected provider.</p>
              </article>
              <article>
                <h3>Multiple wallet providers</h3>
                <p>The provider resolver checks EIP-6963 announcements and injected provider arrays to select MetaMask explicitly.</p>
              </article>
              <article>
                <h3>Wrong chain</h3>
                <p>The app asks MetaMask to switch to Sepolia and adds the network if MetaMask returns chain-not-added.</p>
              </article>
              <article>
                <h3>Insufficient gas</h3>
                <p>Sepolia ETH is still required for transactions. Token faucet funding does not pay gas.</p>
              </article>
              <article>
                <h3>Insufficient token balance</h3>
                <p>If the wallet lacks the needed backing token or FHERC20 test balance, MetaMask or the contract call will reject or revert.</p>
              </article>
              <article>
                <h3>Allowance missing</h3>
                <p>The app checks allowance and sends approve before shield. Users must confirm both transactions for a first-time send.</p>
              </article>
              <article>
                <h3>Rejected wallet request</h3>
                <p>If a user rejects connect, switch, approve, faucet, or send, the app surfaces the wallet error in a toast.</p>
              </article>
              <article>
                <h3>Pending transaction</h3>
                <p>The UI shows a transaction update and links to Etherscan, but final state depends on chain confirmation.</p>
              </article>
              <article>
                <h3>Receiver address mistakes</h3>
                <p>The UI allows custom receiver input. In production, address validation, ENS handling, and confirmation review should be added.</p>
              </article>
              <article>
                <h3>Bridge replay risk</h3>
                <p>A production cross-chain receiver must enforce nonces and message IDs so the same bridge message cannot mint twice.</p>
              </article>
              <article>
                <h3>Origin spoofing</h3>
                <p>The bridge receiver must validate source chain, sender contract, token address, and pool destination before accepting liquidity.</p>
              </article>
              <article>
                <h3>Privacy overstatement</h3>
                <p>FHE protects encrypted state. It does not automatically hide IP metadata, wallet timing, source-chain bridge events, or public transaction submission.</p>
              </article>
            </div>
          </section>

          <section className="manual-section" id="production">
            <h2>Production path for Fhenix</h2>
            <p>
              The current Sepolia implementation is a presentable proof of the user flow and token wrapper model. To move this into a complete Fhenix deployment, the next
              milestone is to deploy the FHERC20 wrapper and pool contracts on the Fhenix/CoFHE target network, then connect a real bridge receiver from Arbitrum Sepolia or
              another EVM testnet.
            </p>
            <h3>Recommended next contracts</h3>
            <ul>
              <li><strong>BridgeReceiver:</strong> accepts verified bridge messages, validates origin, and releases or mints liquidity on Fhenix.</li>
              <li><strong>FHERC20Wrapper:</strong> wraps a public/canonical token into an encrypted FHERC20 representation.</li>
              <li><strong>ShieldedPool:</strong> stores encrypted pool balances and exposes deposit, withdraw, transfer, and accounting actions.</li>
              <li><strong>PoolRouter:</strong> maps incoming bridge liquidity to the right shielded pool and receiver address.</li>
              <li><strong>Permit/decryption helpers:</strong> lets authorized users view their own balance without exposing global pool state.</li>
            </ul>
            <h3>Frontend additions</h3>
            <ul>
              <li>Source-chain selector for Arbitrum, Ethereum Sepolia, and future EVM chains.</li>
              <li>Bridge status timeline: source tx, bridge message, destination receive, FHERC20 mint/wrap, shielded pool deposit.</li>
              <li>Encrypted balance view using CoFHE client/decryption permissions when the connected wallet is authorized.</li>
              <li>Production validation for receiver address, amount bounds, token decimals, bridge fees, and stuck-message recovery.</li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}
