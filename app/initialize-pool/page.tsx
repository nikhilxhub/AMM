import { setAuthority } from "@solana/spl-token";
import { useState } from "react";

export default function initializePoolPage() {

    const [mintX, setMintX] = useState("");
    const [mintY, setMintY] = useState("");
    const [seed, setSeed] = useState("");
    const [fee, setFee] = useState("300");
    const [authority, setAuthority] = useState("");

    async function handleInitializePool() {
        
        
    }

    
    return (

        <div>

            <input value={mintX} onChange={(e) => setMintX(e.target.value)} placeholder="Mint X"/>
            <input value={mintY} onChange={(e) => setMintY(e.target.value)} placeholder="Mint Y"/>
            <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Seed"/>
            <input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Fee in bps"/>
            <input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="Authority"/>

            <button onClick={handleInitializePool}>Initialize pool</button>
        </div>
    )
};