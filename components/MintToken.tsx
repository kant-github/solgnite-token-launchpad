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
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "./toast/useToast";
import { ToastAction } from "./toast/toast";

interface Props {
    mintPublicKey: PublicKey;
}

export default function MintToken({ mintPublicKey }: Props) {
    const wallet = useWallet();
    const { connection } = useConnection();
    const { toast } = useToast();

    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState<number>(1);
    const [ata, setAta] = useState<PublicKey | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handleCopy() {
        if (!ata) return;
        navigator.clipboard.writeText(ata.toBase58());
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    async function mintToken() {
        if (!wallet.publicKey) return;
        if (amount <= 0 || isNaN(amount)) {
            setError("Please enter a valid amount greater than 0.");
            return;
        }

        const ataAddress = getAssociatedTokenAddressSync(
            mintPublicKey,
            wallet.publicKey,
            false,
            TOKEN_PROGRAM_ID
        );

        const transaction = new Transaction();
        setLoading(true);
        setError(null);

        try {
            await getAccount(connection, ataAddress);
        } catch {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    ataAddress,
                    wallet.publicKey,
                    mintPublicKey,
                    TOKEN_PROGRAM_ID
                )
            );

            try {
                const createATAResponse = await wallet.sendTransaction(transaction, connection);
                console.log("createATA tx:", createATAResponse);
                toast({
                    title: "ATA Created",
                    description: `${ataAddress.toBase58().slice(0, 8)}...`,
                    action: (
                        <ToastAction
                            altText="Copy ATA"
                            onClick={() => {
                                navigator.clipboard.writeText(ataAddress.toBase58());
                                toast({
                                    title: "Copied!",
                                    description: "ATA address copied to clipboard.",
                                });
                            }}
                        >
                            Copy
                        </ToastAction>
                    ),
                });
            } catch {
                setError("Failed to create ATA.");
                setLoading(false);
                return;
            }
        }

        setAta(ataAddress);

        const mintTransaction = new Transaction().add(
            createMintToInstruction(
                mintPublicKey,
                ataAddress,
                wallet.publicKey,
                1_000_000_000 * amount,
                [],
                TOKEN_PROGRAM_ID
            )
        );

        try {
            await wallet.sendTransaction(mintTransaction, connection);
            toast({
                title: `${1_000_000_000 * amount} tokens minted successfully`,
            });

        } catch {
            setError("Transaction failed. Please try again.");
        }

        setLoading(false);
    }

    return (
        <div className="flex flex-col max-w-sm w-full gap-5 bg-neutral-900 p-6 rounded-2xl shadow-2xl text-white border border-violet-500/10 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-violet-400 text-center">Mint Tokens</h2>

            <div className="flex flex-col gap-2">
                <label htmlFor="amount" className="text-sm text-zinc-400">
                    Enter Amount to Mint
                </label>
                <input
                    id="amount"
                    type="number"
                    placeholder="e.g. 10"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="bg-neutral-800/60 border border-violet-500/20 text-sm px-4 py-3 rounded-xl placeholder:text-zinc-500 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
            </div>

            <button
                onClick={mintToken}
                type="button"
                disabled={loading || !wallet.publicKey}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${loading || !wallet.publicKey
                    ? "bg-neutral-700 cursor-not-allowed text-zinc-400"
                    : "bg-violet-500/90 hover:bg-violet-600 hover:brightness-110 text-black shadow-lg"
                    }`}
            >
                {loading ? "Minting..." : "Mint Token"}
            </button>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            {!wallet.publicKey && (
                <p className="text-center text-zinc-400 text-sm">Connect your wallet to mint tokens.</p>
            )}

            {ata && (
                <div className="bg-neutral-800/60 rounded-xl px-4 py-3 text-sm text-violet-400 border border-violet-500/10 mt-2 break-words">
                    ✅ Associated Token Account:
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-zinc-300 break-all font-mono">{ata.toBase58()}</span>
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-neutral-700/50 rounded-lg transition"
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-violet-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-zinc-400 hover:text-white" />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
