const AppError = require('../utils/appError');

// @ERROR-HANDLER-FUNCTION
const sendErrorDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    // RENDERD WEBSITE
    res.status(err.statusCode).render('error', {
        title: 'Someting went wrong!',
        msg: err.message,
    });
};

const sendErrorProd = (err, req, res) => {
    // Operational, trusted error: send message to client
    // API
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });

            // Programming or other unknown error: don't leark error details
        }
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    }
    // RENDERED WEBSITE
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Someting went wrong!',
            msg: err.message,
        });

        // Programming or other unknown error: don't leark error details
    }
    return res.status(err.statusCode).render('error', {
        title: 'Someting went wrong!',
        msg: 'Please try again later.',
    });
};

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.keyValue.name;

    const message = `Duplicate field value: '${value}'  please use another value!`;

    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const value = Object.values(err.errors).map(el => el.value);

    const message = `Invalid values '${value.join(', ')}', ${errors.join(
        '. ',
    )}`;

    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid Token Please login again', 401);
const handleJWTErrorEx = () =>
    new AppError('Token Has Been Expired Login Again Please', 401);

// @MIDDLEWARE
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };

        error.message = err.message;

        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicateFieldsDB(error);
        if (err._message === 'Validation failed')
            error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTErrorEx();
        sendErrorProd(error, req, res);
    }
};
