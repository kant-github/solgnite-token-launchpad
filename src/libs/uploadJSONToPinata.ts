'use server'

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

export async function uploadJSONToPinata(metadata: object) {
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            pinata_api_key: PINATA_API_KEY!,
            pinata_secret_api_key: PINATA_SECRET_KEY!
        },
        body: JSON.stringify(metadata)
    });

    const json = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${json.IpfsHash}`;
}
