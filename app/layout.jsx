import "./globals.css";

export const metadata = {
  title: "Axicom",
  description: "FHERC20 shielded liquidity on Ethereum Sepolia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
