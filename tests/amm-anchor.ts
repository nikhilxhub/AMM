 import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import type { Amm } from "../anchor/target/types/amm";
import idl from "../anchor/target/idl/amm.json";


describe("AMM Tests", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = new Program(idl as Amm, provider);

    it("loads the program", async () => {
        console.log("Program ID:", program.programId.toBase58());
    })

    
    
})