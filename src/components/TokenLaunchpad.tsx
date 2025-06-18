'use client'
import { useState } from "react";
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Check, Copy, Plus } from "lucide-react";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { uploadFileToIPFS } from "../libs/uploadFileToIPFS";
import { uploadJSONToPinata } from "../libs/uploadJSONToPinata";
import Image from "next/image";
import { toast } from "sonner";

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
    const [file, setFile] = useState<File | null>(null);
    const [tokenMetadata, setTokenMetadata] = useState({
        name: '',
        symbol: '',
        imageUrl: '',
    });


    function handleCopy(mintKey: string) {
        navigator.clipboard.writeText(mintKey);
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

        let imageURI = "";
        if (file) {
            imageURI = await uploadFileToIPFS(file);
            imageURI = imageURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            console.log("image uri is : ", imageURI);
            setTokenMetadata((prev) => ({
                ...prev,
                imageUrl: imageURI
            }));
        }


        const metadataJson = {
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            description: `Token for ${tokenMetadata.name}`,
            image: imageURI,
            properties: {
                files: [{ uri: imageURI, type: file?.type }],
                category: "image"
            }
        };

        const metadataURI = await uploadJSONToPinata(metadataJson);
        console.log("metadata uri is : ", metadataURI);

        const metadataData = {
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            uri: metadataURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"),
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
        toast('Mint Created Successfully !', {
            action: {
                label: copied ? <Check /> : <Copy />,
                onClick: () => handleCopy(newKeyPair.publicKey.toBase58()),
            }
        });
    }

    return (
        <div className="relative max-w-md w-full">
            {/* Glassmorphism background with gradient border */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-700/20 via-green-600/10 to-green-500/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-neutral-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">

                {/* Header with icon */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-green-300 to-green-200 bg-clip-text text-transparent">
                        Create Your Token
                    </h2>
                    <p className="text-neutral-400 text-sm mt-2">Launch your custom token in minutes</p>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    {["Token Name", "Token Symbol"].map((label, idx) => {
                        const keys = ["name", "symbol"] as const;
                        return (
                            <div key={label} className="group">
                                <label className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                                    {label}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={`Enter ${label.toLowerCase()}`}
                                        className="w-full bg-neutral-800/50 backdrop-blur-sm text-white px-4 py-4 pl-12 rounded-2xl border border-neutral-700/50 placeholder:text-neutral-500 outline-none transition-all duration-300 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 focus:bg-neutral-800/80 hover:border-neutral-600/50"
                                        value={tokenMetadata[keys[idx]]}
                                        onChange={(e) =>
                                            setTokenMetadata((prev) => ({
                                                ...prev,
                                                [keys[idx]]: e.target.value
                                            }))
                                        }
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 group-focus-within:text-green-400 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {idx === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
                                            {idx === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />}
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* File Upload Section */}
                    <div className="group flex items-center justify-between w-full gap-x-3">
                        {tokenMetadata.imageUrl && (
                            <div className="flex justify-center">
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-green-500/30 shadow-lg ring-4 ring-green-500/10">
                                    <Image
                                        src={tokenMetadata.imageUrl}
                                        alt="Token Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            </div>
                        )}
                        <div className="w-full">
                            <label className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                                Upload Image
                            </label>
                            <div className="relative flex flex-row items-center">
                                <input
                                    id="file"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="file"
                                    className="flex items-center justify-center w-full h-16 bg-neutral-800/50 backdrop-blur-sm border-2 border-dashed border-neutral-700/50 rounded-2xl cursor-pointer transition-all duration-300 hover:border-green-500/50 hover:bg-neutral-800/80 group-hover:border-neutral-600/50">
                                    <div className="flex items-center gap-3 text-neutral-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="text-sm font-medium">Choose file or drag & drop</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Image Preview */}


                    <button
                        onClick={createToken}
                        type="button"
                        className="w-full relative group bg-green-500/90 hover:bg-green-600 text-black font-semibold px-6 py-4 rounded-2xl transition-all active:scale-[0.98]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <Plus size={18} />
                            Create Token
                        </span>
                        <div className="absolute inset-0 rounded-md blur-sm opacity-30 group-hover:opacity-40 bg-green-500"></div>
                    </button>
                </div>
            </div>
        </div>
    );

}



