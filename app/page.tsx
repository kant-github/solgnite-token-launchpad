'use client'

import MintToken from '@/src/components/MintToken';
import TokenLaunchpad from '@/src/components/TokenLaunchpad';
import WalletConnector from '@/src/components/WalletConnector';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';

export default function Home() {
  const [mintAccountPubKey, setMintAccountPubKey] = useState<PublicKey | null>(null);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-4 text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">Solana Token Launchpad</h1>

      <div className="w-full space-y-6 flex  items-start justify-center gap-x-4">
        <WalletConnector />
        <TokenLaunchpad onMintCreated={setMintAccountPubKey} />
        {mintAccountPubKey && <MintToken mintPublicKey={mintAccountPubKey} />}
      </div>
    </div>
  );
}