export const notFound = (req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler. Express 5 forwards errors thrown in async route handlers here.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.code === 11000) {
    status = 409;
    message = `That ${Object.keys(err.keyValue || { value: 1 })[0]} is already in use`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)[0].message;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  } else if (err.name === 'MulterError') {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Each image must be 5 MB or smaller'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'You can upload up to 10 images'
          : err.message;
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Server error';
  }

  res.status(status).json({ message });
};
