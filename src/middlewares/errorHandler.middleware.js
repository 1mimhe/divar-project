const notFoundError = (req, res) => {
    return res.status(404).json({
        statusCode: res.statusCode,
        error: {
            type: 'NotFound',
            message: `Route ${req.url} not found.`
        }
    });
}

const errorHandler = (err, req, res) => {
    return res.json({
        statusCode: err?.status ?? err?.statusCode ?? 500,
        error: {
            message: err?.message ?? "internalServerError",
            invalidParams: err?.error
        }
    });
}

module.exports = {
    notFoundError,
    errorHandler
};