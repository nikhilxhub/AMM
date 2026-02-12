
#[derive(Accounts)]
pub struct Initialize<'info> {

    #[account(mut)]
    pub admin: Signer<'info>,

    
}