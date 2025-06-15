'use client'

import {
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    getAccount,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useState } from "react";

interface Props {
    mintPublicKey: PublicKey;
}

export default function MintToken({ mintPublicKey }: Props) {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [loading, setLoading] = useState(false);
    const [txHash, setTxHash] = useState("");
    const [amount, setAmount] = useState<number>(1);
    const [ata, setAta] = useState<PublicKey | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function mintToken() {
        if (!wallet.publicKey) return;
        if (amount <= 0 || isNaN(amount)) {
            setError("Please enter a valid amount greater than 0.");
            return;
        }

        const ata = getAssociatedTokenAddressSync(
            mintPublicKey,
            wallet.publicKey,
            false,
            TOKEN_PROGRAM_ID
        );

        const transaction = new Transaction();
        setLoading(true);
        setError(null);
        setTxHash("");

        try {
            await getAccount(connection, ata);
        } catch {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    ata,
                    wallet.publicKey,
                    mintPublicKey,
                    TOKEN_PROGRAM_ID
                )
            );

            const createATAResponse = await wallet.sendTransaction(transaction, connection);
            console.log("createATA tx:", createATAResponse);
        }

        setAta(ata);

        const mintTransaction = new Transaction().add(
            createMintToInstruction(
                mintPublicKey,
                ata,
                wallet.publicKey,
                1_000_000_000 * amount, // 1e9 = 1 token with 9 decimals
                [],
                TOKEN_PROGRAM_ID
            )
        );

        try {
            const mintResponse = await wallet.sendTransaction(mintTransaction, connection);
            console.log("mint tx:", mintResponse);
            setTxHash(mintResponse);
        } catch {
            setError("Transaction failed. Please try again.");
        }

        setLoading(false);
    }

    return (
        <div className="flex flex-col max-w-sm w-full gap-5 bg-zinc-900 p-6 rounded-2xl shadow-lg text-white border-[1px] border-neutral-800">
            <h2 className="text-xl font-semibold text-emerald-400 text-center">Mint Tokens</h2>

            <div className="flex flex-col gap-1">
                <label htmlFor="amount" className="text-sm text-zinc-300">
                    Enter Amount to Mint
                </label>
                <input
                    id="amount"
                    type="number"
                    className="bg-zinc-800 border border-zinc-700 text-sm px-4 py-2 rounded-md placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 10"
                    value={amount}
                    min={1}
                    onChange={(e) => setAmount(Number(e.target.value))}
                />
            </div>

            <button
                onClick={mintToken}
                type="button"
                disabled={loading || !wallet.publicKey}
                className={`w-full py-2 rounded-lg text-sm font-medium transition duration-300
          ${loading || !wallet.publicKey
                        ? "bg-zinc-700 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600"
                    } text-white shadow-md`}
            >
                {loading ? "Minting..." : "Mint Token"}
            </button>

            {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {txHash && (
                <div className="text-sm text-center text-emerald-400 break-words">
                    ✅ Token Minted Successfully!
                    <br />
                    <span className="text-xs text-zinc-300">Tx Hash: {txHash}</span>
                </div>
            )}

            {!wallet.publicKey && (
                <p className="text-center text-zinc-400 text-sm">
                    Connect your wallet to mint tokens.
                </p>
            )}

            {ata && (
                <div className="bg-zinc-800 rounded-md px-3 py-2 text-sm text-green-400 mt-2 break-words">
                    ✅ Associated Token Account:
                    <br />
                    <span className="text-xs text-zinc-300">{ata.toBase58()}</span>
                </div>
            )}
        </div>
    );
}
