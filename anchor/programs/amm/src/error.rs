use anchor_lang::error_code;
use constant_product_curve::CurveError;

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
    ZeroBalance,
    #[msg("Underflow Detected")]
    Underflow,
}

impl From<CurveError> for AMMError {
    fn from(error: CurveError) -> AMMError {
        match error {
            CurveError::InvalidPrecision      => AMMError::InvalidPrecision,
            CurveError::Overflow              => AMMError::Overflow,
            CurveError::Underflow             => AMMError::Underflow,
            CurveError::InvalidFeeAmount      => AMMError::InvalidAmount,
            CurveError::InsufficientBalance   => AMMError::InsufficientBalance,
            CurveError::ZeroBalance           => AMMError::ZeroBalance,
            CurveError::SlippageLimitExceeded => AMMError::SlippageExceeded,
        }
    }
}