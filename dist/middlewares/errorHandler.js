"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Une erreur interne est survenue';
    res.status(statusCode).json({
        message: message,
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
}
