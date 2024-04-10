const notFoundError = (req, res) => {
    return res.status(404).json({
        statusCode: res.statusCode,
        error: {
            type: 'NotFound',
            message: `Route ${req.url} not found.`
        }
    });
}

const allErrorHandler = (err, req, res) => {
    const statusCode = err?.status ?? err?.statusCode ?? err?.code ?? 500;
    return res.status(statusCode).json({
        statusCode,
        error: {
            message: err?.message ?? err?.stack ?? "InternalServerError",
            invalidParams: err?.error
        }
    });
}

module.exports = {
    notFoundError,
    allErrorHandler
};