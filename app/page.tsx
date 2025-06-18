'use client'

import MintToken from '@/src/components/MintToken';
import TokenLaunchpad from '@/src/components/TokenLaunchpad';
import WalletConnector from '@/src/components/WalletConnector';
import { PublicKey } from '@solana/web3.js';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [mintAccountPubKey, setMintAccountPubKey] = useState<PublicKey | null>(null);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
        <Sparkles className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-green-300">Token Launchpad</span>
      </div>


      <div className="w-full space-y-6 flex  items-start justify-center gap-x-4">
        <WalletConnector />
        <TokenLaunchpad onMintCreated={setMintAccountPubKey} />
        {mintAccountPubKey && <MintToken mintPublicKey={mintAccountPubKey} />}
      </div>
    </div>
  );
}