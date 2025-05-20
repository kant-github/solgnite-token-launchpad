import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import '@solana/wallet-adapter-react-ui/styles.css'

export default function WalletConnector() {
    return (
        <div className="flex items-center justify-center gap-x-4 absolute top-5 right-5">
            <WalletDisconnectButton />
            <WalletMultiButton />
        </div>
    )
}