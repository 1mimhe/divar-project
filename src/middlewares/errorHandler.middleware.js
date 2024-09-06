const notFoundError = (req, res, next) => {
    return res.status(404).json({
        statusCode: res.statusCode,
        error: {
            type: 'NotFound',
            message: `Route ${req.url} not found.`
        }
    });
}

const allErrorHandler = (err, req, res, next) => {
    const statusCode = err?.status ?? err?.statusCode ?? 500;
    if (process.env.NODE_ENV === "development") console.log(err);
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