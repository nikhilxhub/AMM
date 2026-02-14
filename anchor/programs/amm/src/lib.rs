use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[cfg(test)]
mod tests;

pub mod instructions;
pub mod state;



pub use instructions::*;
pub use state::*;

declare_id!("6uN6r125EwMdqmbW5bDPUXoWSDdUQ79Bbv5JZksB4Gjf");

#[program]
pub mod amm {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        fee:u16,
        authority: Option<Pubkey>,

    ) -> Result<()> {


        ctx.accounts.initialize(seed, fee, authority, &ctx.bumps)?;

        Ok(())
        
    }
   
}

