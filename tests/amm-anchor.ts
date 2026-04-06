import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import { createClient } from "@solana/client";
import {
  generateKeyPairSigner,
  getAddressEncoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  lamports,
  type Address,
  type Instruction,
  type TransactionSigner,
} from "@solana/kit";
import {
  TOKEN_PROGRAM_ADDRESS,
  fetchMint,
  fetchToken,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getInitializeMint2Instruction,
  getMintToCheckedInstruction,
} from "@solana-program/token";
import {
  SYSTEM_PROGRAM_ADDRESS,
  getCreateAccountInstruction,
} from "@solana-program/system";

import {
  AMM_PROGRAM_ADDRESS,
  fetchConfig,
  getDepositInstructionAsync,
  getInitializeInstructionAsync,
  getLockInstruction,
  getSwapInstructionAsync,
  getUnlockInstruction,
  getWithdrawInstructionAsync,
} from "../app/generated/amm";

const client = createClient({ cluster: "localnet" });

const LAMPORTS_PER_SOL = 1_000_000_000n;
const DECIMALS = 6;
const MINT_SPACE = 82n;
const MINIMUM_BALANCE_FOR_MINT = 1_461_600n;

describe("AMM Tests", () => {
  const adminSeed = randomBytes(8).readBigUInt64LE(0);
  const fee = 300;

  let admin: TransactionSigner;
  let user: TransactionSigner;
  let mintX: TransactionSigner;
  let mintY: TransactionSigner;

  let config: Address;
  let mintLp: Address;
  let vaultX: Address;
  let vaultY: Address;
  let userX: Address;
  let userY: Address;
  let userLp: Address;

  async function sendInstructions(
    feePayer: TransactionSigner,
    instructions: Instruction[],
  ) {
    const prepared = await client.transaction.prepare({
      feePayer,
      instructions,
    });

    return client.transaction.send(prepared);
  }

  async function createMint(
    payer: TransactionSigner,
    mint: TransactionSigner,
    authority: Address,
  ) {
    await sendInstructions(payer, [
      getCreateAccountInstruction({
        payer,
        newAccount: mint,
        lamports: MINIMUM_BALANCE_FOR_MINT,
        space: MINT_SPACE,
        programAddress: TOKEN_PROGRAM_ADDRESS,
      }),
      getInitializeMint2Instruction({
        mint: mint.address,
        decimals: DECIMALS,
        mintAuthority: authority,
      }),
    ]);
  }

  async function mintToAta(
    payer: TransactionSigner,
    owner: Address,
    mint: Address,
    mintAuthority: TransactionSigner,
    amount: bigint,
  ) {
    const [ata] = await findAssociatedTokenPda({
      owner,
      mint,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    await sendInstructions(payer, [
      getCreateAssociatedTokenIdempotentInstruction({
        payer,
        ata,
        owner,
        mint,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      }),
      getMintToCheckedInstruction({
        mint,
        token: ata,
        mintAuthority,
        amount,
        decimals: DECIMALS,
      }),
    ]);

    return ata;
  }

  async function getTokenAmount(tokenAddress: Address) {
    const token = await fetchToken(client.runtime.rpc, tokenAddress);
    return token.data.amount;
  }

  before("Setup", async () => {
    admin = await generateKeyPairSigner();
    user = await generateKeyPairSigner();
    mintX = await generateKeyPairSigner();
    mintY = await generateKeyPairSigner();

    await client.actions.requestAirdrop(
      admin.address,
      lamports(10n * LAMPORTS_PER_SOL),
    );
    await client.actions.requestAirdrop(
      user.address,
      lamports(10n * LAMPORTS_PER_SOL),
    );

    const seedBytes = new BigUint64Array([adminSeed]);
    [config] = await getProgramDerivedAddress({
      programAddress: AMM_PROGRAM_ADDRESS,
      seeds: [
        getBytesEncoder().encode(new Uint8Array([99, 111, 110, 102, 105, 103])),
        new Uint8Array(seedBytes.buffer),
      ],
    });

    [mintLp] = await getProgramDerivedAddress({
      programAddress: AMM_PROGRAM_ADDRESS,
      seeds: [
        getBytesEncoder().encode(new Uint8Array([108, 112])),
        getAddressEncoder().encode(config),
      ],
    });

    [vaultX] = await findAssociatedTokenPda({
      owner: config,
      mint: mintX.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    [vaultY] = await findAssociatedTokenPda({
      owner: config,
      mint: mintY.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    await createMint(admin, mintX, admin.address);
    await createMint(admin, mintY, admin.address);

    userX = await mintToAta(
      admin,
      user.address,
      mintX.address,
      admin,
      1_000n * 10n ** BigInt(DECIMALS),
    );
    userY = await mintToAta(
      admin,
      user.address,
      mintY.address,
      admin,
      1_000n * 10n ** BigInt(DECIMALS),
    );
  });

  it("Initialize pool", async () => {
    const instruction = await getInitializeInstructionAsync({
      admin,
      mintX: mintX.address,
      mintY: mintY.address,
      seed: adminSeed,
      fee,
      authority: admin.address,
    });

    await sendInstructions(admin, [instruction]);

    const configAccount = await fetchConfig(client.runtime.rpc, config);
    assert.equal(configAccount.data.fee, fee);
    assert.equal(configAccount.data.locked, false);
    assert.equal(configAccount.data.mintX, mintX.address);
    assert.equal(configAccount.data.mintY, mintY.address);
  });

  it("Deposit liquidity", async () => {
    [userLp] = await findAssociatedTokenPda({
      owner: user.address,
      mint: mintLp,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const instruction = await getDepositInstructionAsync({
      user,
      mintX: mintX.address,
      mintY: mintY.address,
      config,
      amount: 100n * 10n ** BigInt(DECIMALS),
      maxX: 50n * 10n ** BigInt(DECIMALS),
      maxY: 50n * 10n ** BigInt(DECIMALS),
    });

    await sendInstructions(user, [instruction]);

    const vaultXBalance = await getTokenAmount(vaultX);
    const vaultYBalance = await getTokenAmount(vaultY);
    const userLpBalance = await getTokenAmount(userLp);

    assert.ok(vaultXBalance > 0n);
    assert.ok(vaultYBalance > 0n);
    assert.ok(userLpBalance > 0n);
  });

  it("Swap X for Y", async () => {
    const userXBefore = await getTokenAmount(userX);
    const userYBefore = await getTokenAmount(userY);

    const instruction = await getSwapInstructionAsync({
      user,
      mintX: mintX.address,
      mintY: mintY.address,
      config,
      isX: true,
      amount: 5n * 10n ** BigInt(DECIMALS),
      min: 1n * 10n ** BigInt(DECIMALS),
    });

    await sendInstructions(user, [instruction]);

    const userXAfter = await getTokenAmount(userX);
    const userYAfter = await getTokenAmount(userY);

    assert.ok(userXAfter < userXBefore);
    assert.ok(userYAfter > userYBefore);
  });

  it("Swap Y for X", async () => {
    const userXBefore = await getTokenAmount(userX);
    const userYBefore = await getTokenAmount(userY);

    const instruction = await getSwapInstructionAsync({
      user,
      mintX: mintX.address,
      mintY: mintY.address,
      config,
      isX: false,
      amount: 3n * 10n ** BigInt(DECIMALS),
      min: 1n * 10n ** BigInt(DECIMALS),
    });

    await sendInstructions(user, [instruction]);

    const userXAfter = await getTokenAmount(userX);
    const userYAfter = await getTokenAmount(userY);

    assert.ok(userXAfter > userXBefore);
    assert.ok(userYAfter < userYBefore);
  });

  it("Lock and unlock pool", async () => {
    await sendInstructions(admin, [getLockInstruction({ user: admin, config })]);

    let configAccount = await fetchConfig(client.runtime.rpc, config);
    assert.equal(configAccount.data.locked, true);

    await sendInstructions(admin, [getUnlockInstruction({ user: admin, config })]);

    configAccount = await fetchConfig(client.runtime.rpc, config);
    assert.equal(configAccount.data.locked, false);
  });

  it("Withdraw liquidity", async () => {
    const userLpBefore = await getTokenAmount(userLp);
    const userXBefore = await getTokenAmount(userX);
    const userYBefore = await getTokenAmount(userY);

    const instruction = await getWithdrawInstructionAsync({
      user,
      mintX: mintX.address,
      mintY: mintY.address,
      config,
      amount: userLpBefore / 2n,
      minX: 1n * 10n ** BigInt(DECIMALS),
      minY: 1n * 10n ** BigInt(DECIMALS),
    });

    await sendInstructions(user, [instruction]);

    const userLpAfter = await getTokenAmount(userLp);
    const userXAfter = await getTokenAmount(userX);
    const userYAfter = await getTokenAmount(userY);
    const lpMint = await fetchMint(client.runtime.rpc, mintLp);

    assert.ok(userLpAfter < userLpBefore);
    assert.ok(userXAfter > userXBefore);
    assert.ok(userYAfter > userYBefore);
    assert.ok(lpMint.data.supply >= userLpAfter);
  });
});
