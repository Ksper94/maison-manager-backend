"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error(err);
    return res.status(500).json({
        message: 'Une erreur interne est survenue',
        error: err.message || err
    });
}
