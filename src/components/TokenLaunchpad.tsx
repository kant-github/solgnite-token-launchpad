'use client'

import Image from "next/image";
import { useState } from "react";
import {
    createInitializeMint2Instruction,
    getMinimumBalanceForRentExemptMint,
    MINT_SIZE,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Check, Copy } from "lucide-react";
import {
    createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

interface Props {
    onMintCreated: (key: PublicKey) => void;
}

export default function TokenLaunchpad({ onMintCreated }: Props) {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [copied, setCopied] = useState(false);
    const [mintAddress, setMintAddress] = useState<PublicKey | null>(null);
    const [tokenMetadata, setTokenMetadata] = useState({
        name: '',
        symbol: '',
        imageUrl: '',
        initialSupply: ''
    });


    function handleCopy() {
        if (!mintAddress) return;
        navigator.clipboard.writeText(mintAddress.toBase58());
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    async function createToken() {
        if (!wallet.publicKey) return;

        const newKeyPair = Keypair.generate();
        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: newKeyPair.publicKey,
                lamports,
                space: MINT_SIZE,
                programId: TOKEN_PROGRAM_ID
            }),
            createInitializeMint2Instruction(
                newKeyPair.publicKey,
                9,
                wallet.publicKey,
                wallet.publicKey
            )
        );

        const metadataPDA = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                newKeyPair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];

        const metadataData = {
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            uri: "ipfs://bafkreibt6xxsggr52wwcfpkf6642qaxhhtalcyn7ejxajyzwxfnbj23weu", // This points to your full metadata.json (not just image)
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
        };


        const ix = createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataPDA,
                mint: newKeyPair.publicKey,
                mintAuthority: wallet.publicKey,
                payer: wallet.publicKey,
                updateAuthority: wallet.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    data: metadataData,
                    isMutable: true,
                    collectionDetails: null,
                },
            }
        )

        transaction.add(ix);


        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;
        transaction.partialSign(newKeyPair);

        const response = await wallet.sendTransaction(transaction, connection);
        console.log("response is:", response);

        onMintCreated(newKeyPair.publicKey);
        setMintAddress(newKeyPair.publicKey);
    }

    return (
        <div className="flex flex-col max-w-sm w-full gap-4 bg-zinc-900 p-6 rounded-2xl shadow-lg border-[1px] border-neutral-800">
            <h2 className="text-xl font-semibold text-purple-400 text-center">Create Your Token</h2>

            {["Token Name", "Token Symbol", "Token Image URL", "Initial Supply"].map((label, idx) => {
                const keys = ["name", "symbol", "imageUrl", "initialSupply"] as const;
                return (
                    <div key={label} className="flex flex-col gap-1">
                        <label className="text-sm text-zinc-300">{label}</label>
                        <input
                            type="text"
                            placeholder={`Enter ${label.toLowerCase()}`}
                            className="bg-zinc-800 text-sm px-4 py-2 rounded-md border border-zinc-700 placeholder:text-zinc-500 outline-none"
                            value={tokenMetadata[keys[idx]]}
                            onChange={(e) =>
                                setTokenMetadata((prev) => ({
                                    ...prev,
                                    [keys[idx]]: e.target.value
                                }))
                            }
                        />
                    </div>
                );
            })}

            {tokenMetadata.imageUrl && (
                <Image
                    src={tokenMetadata.imageUrl}
                    alt="Token Preview"
                    width={64}
                    height={64}
                    className="rounded-full object-cover mx-auto mt-2 border border-zinc-600"
                />
            )}

            <button
                onClick={createToken}
                type="button"
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-md mt-2 transition-all shadow-md"
            >
                Create Token
            </button>
            {mintAddress && (
                <div className="bg-zinc-800 rounded-md px-3 py-2 text-sm text-green-400 mt-2 break-words">
                    ✅ Mint Address Created:
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-300 break-all">
                            {mintAddress.toBase58()}
                        </span>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="ml-2 p-1 hover:bg-zinc-700 rounded transition"
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-zinc-400" />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
