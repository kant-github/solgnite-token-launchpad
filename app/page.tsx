'use client'

import TokenLaunchpad from "@/src/components/TokenLaunchpad";
import WalletConnector from "@/src/components/WalletConnector";


export default function Home() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <WalletConnector />
      <TokenLaunchpad />
    </div>
  );
}
