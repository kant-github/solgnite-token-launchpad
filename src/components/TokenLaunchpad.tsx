'use client'
import Image from "next/image"
import { useState } from "react"
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js"

export default function TokenLaunchpad() {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [tokenMetadata, setTokenMetadata] = useState({
        name: '',
        symbol: '',
        imageUrl: '',
        initialSupply: ''
    })

    async function createToken() {

        const newKeyPair = Keypair.generate();
        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey!,
                newAccountPubkey: newKeyPair.publicKey,
                lamports,
                space: MINT_SIZE,
                programId: TOKEN_PROGRAM_ID
            }),
            createInitializeMint2Instruction(newKeyPair.publicKey, 6, wallet.publicKey!, wallet.publicKey, TOKEN_PROGRAM_ID)
        )

        // remember , in solana if you try to sign a transaction, you have to add the recent block hash in you transaction, only then it will get added to the blockchain
        const recentBlockHash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = recentBlockHash.blockhash;
        transaction.feePayer = wallet.publicKey!

        transaction.partialSign(newKeyPair);

        const response = await wallet.sendTransaction(transaction, connection);
        console.log("response is : ", response);
    }

    return (
        <div className="flex flex-col max-w-sm w-full gap-4 bg-neutral-800 p-8 rounded-xl shadow-lg text-white">
            <h2 className="text-lg font-semibold text-center">Create Your Token</h2>

            <div className="flex flex-col gap-1">
                <label className="text-sm">Token Name</label>
                <input
                    type="text"
                    placeholder="Enter token name"
                    className="bg-neutral-900 text-sm px-4 py-2 rounded-md border border-neutral-700 placeholder:text-neutral-400 outline-none"
                    value={tokenMetadata.name}
                    onChange={(e) => setTokenMetadata(prev => ({ ...prev, name: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm">Token Symbol</label>
                <input
                    type="text"
                    placeholder="e.g. ETH"
                    className="bg-neutral-900 text-sm px-4 py-2 rounded-md border border-neutral-700 placeholder:text-neutral-400 outline-none"
                    value={tokenMetadata.symbol}
                    onChange={(e) => setTokenMetadata(prev => ({ ...prev, symbol: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm">Token Image URL</label>
                <input
                    type="text"
                    placeholder="Paste image URL"
                    className="bg-neutral-900 text-sm px-4 py-2 rounded-md border border-neutral-700 placeholder:text-neutral-400 outline-none"
                    value={tokenMetadata.imageUrl}
                    onChange={(e) => setTokenMetadata(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm">Initial Supply</label>
                <input
                    type="text"
                    placeholder="e.g. 1000000"
                    className="bg-neutral-900 text-sm px-4 py-2 rounded-md border border-neutral-700 placeholder:text-neutral-400 outline-none"
                    value={tokenMetadata.initialSupply}
                    onChange={(e) => setTokenMetadata(prev => ({ ...prev, initialSupply: e.target.value }))}
                />
            </div>

            {tokenMetadata.imageUrl && (
                <Image
                    src={tokenMetadata.imageUrl}
                    alt="Token Preview"
                    className="w-16 h-16 rounded-full object-cover mx-auto mt-2 border border-neutral-700"
                />
            )}

            <button
                onClick={createToken}
                type="button"
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-md mt-4 transition-colors"
            >
                Create Token
            </button>
        </div>
    )
}
