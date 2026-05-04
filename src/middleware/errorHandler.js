const errorHandler = (err, req, res, next) => {
  // FIX: Prevent "Error [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received type undefined"
  // This happens when calling res.json() with an undefined value (e.g., after a failed delete)
  if (err === undefined) {
    return res.status(204).send();
  }

  console.error(err.stack);

  // Prisma Unique Constraint Error
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Unique constraint violation',
      details: `The ${err.meta.target} already exists.`
    });
  }

  // Prisma Record Not Found Error
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
