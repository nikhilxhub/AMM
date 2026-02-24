use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint_x:Account<'info,Mint>,
    pub mint_y:Account<'info,Mint>,

}


impl<'info> Deposit<'info>{
    pub fn deposit(
        &mut self,
        amount: u64,
        max_x: u64,
        max_y: u64,
    ) -> Result<()> {

        
    }
}