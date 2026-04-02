use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[cfg(test)]
mod tests;

pub mod instructions;
pub mod state;
pub mod error;




pub use instructions::*;
pub use state::*;
pub use error::*;

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


    pub fn deposit(ctx: Context<Deposit>, amount: u64, max_x: u64, max_y: u64) -> Result<()> {

        ctx.accounts.deposit(amount, max_x, max_y)?;
        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, is_x: bool, amount: u64, min: u64) -> Result<()> {
        ctx.accounts.swap(is_x, amount, min)?;

        Ok(())

    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64,min_x: u64, min_y: u64) -> Result<()>{

        ctx.accounts.withdraw(amount, min_x, min_y)?;

        Ok(())
    }
    
   
}

