use anchor_lang::error_code;

#[error_code]
pub enum AMMError {

    #[msg("This pool is Locked")]
    PoolLocked,
    #[msg("Invalid Amount")]
    InvalidAmount,
    #[msg("Slippage Exceeded")]
    SlippageExceeded,
    #[msg("Overflow Detected")]
    Overflow,
    #[msg("Underfow Detected")]
    Underfow,
    #[msg("Invalid Authority")]
    InvalidAuthority,
    #[msg("Invalid Precision")]
    InvalidPrecision,
    #[msg("Insufficient Balance")]
    InsufficientBalance,
    #[msg("Zero Balance")]
    ZeroBalance
}