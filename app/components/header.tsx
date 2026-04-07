"use client";

import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";

export function Header() {
  const { connectors, connect, disconnect, wallet, status } =
    useWalletConnection();

  const address = wallet?.account.address.toString();
  const [showWallets, setShowWallets] = useState(false);

  const handleWalletClick = () => {
    if (status === "connected") {
      setShowWallets(false);
      disconnect();
      return;
    }

    setShowWallets((current) => !current);
  };

  const handleConnect = (connectorId: string) => {
    setShowWallets(false);
    connect(connectorId);
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border-low px-6 py-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
          Dex for devs
        </p>
        <p className="text-xs text-muted">
          {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Devnet"}
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={handleWalletClick}
          disabled={status === "connecting" || connectors.length === 0}
          className="inline-flex min-w-40 items-center justify-center rounded-lg border border-border-low bg-card px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "connecting"
            ? "Connecting..."
            : status === "connected"
              ? "Disconnect Wallet"
              : connectors.length > 0
                ? "Connect Wallet"
                : "No wallet found"}
        </button>

        {showWallets && status !== "connected" && connectors.length > 0 ? (
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border-low bg-card p-2 shadow-lg">
            <div className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted">
              Choose wallet
            </div>
            <div className="mt-1 flex flex-col gap-1">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  type="button"
                  onClick={() => handleConnect(connector.id)}
                  className="rounded-lg px-3 py-2 text-left text-sm transition hover:bg-cream"
                >
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
