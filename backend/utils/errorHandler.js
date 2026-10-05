const { Prisma } = require('@prisma/client');

const handleDbError = (err, res, defaultMessage = 'Internal server error') => {
  // If it's a known Prisma error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint failed
        const target = err.meta && err.meta.target ? err.meta.target : 'field';
        return res.status(400).json({
          success: false,
          message: `Unique constraint failed: ${target} already exists.`
        });
      case 'P2003':
        // Foreign key constraint failed
        return res.status(400).json({
          success: false,
          message: 'Foreign key constraint violation. Referenced record does not exist.'
        });
      case 'P2025':
        // Record not found
        return res.status(404).json({
          success: false,
          message: 'Record not found or already deleted.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Database operation failed.',
          code: err.code
        });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided for database operation.'
    });
  }

  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    // Connection/transaction failures
    console.error('Prisma critical/connection error:', err);
    return res.status(503).json({
      success: false,
      message: 'Database connection or transaction failure. Please try again later.'
    });
  }

  // Fallback for general errors
  console.error('Unhandled Server Error:', err);
  
  // Clean error response hiding raw secrets/strings
  const msg = err.message && !err.message.includes('postgresql://') && !err.message.includes('mongodb') 
    ? err.message 
    : defaultMessage;

  return res.status(500).json({
    success: false,
    message: msg
  });
};

module.exports = { handleDbError };
