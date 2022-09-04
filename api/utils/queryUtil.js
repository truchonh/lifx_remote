const _ = require('lodash');
const logger = require('./simpleLogger')

class queryUtil {
    /**
     *
     * @param context
     * @returns {queryUtil}
     */
    static getHandlerFactory(context) {
        return new queryUtil(context);
    }

    constructor(context) {
        this._context = context;
    }

    /**
     * Create a request handler function.
     * @param {function(*, *): *} handlerFn
     * @returns {function(*=, *=): Promise<void>}
     */
    makeHandler(handlerFn) {
        return async (req, res) => {
            let boundHandler = handlerFn.bind(this._context);

            try {
                let response = await boundHandler(req, res);
                res.send(await queryUtil.prepareResponse(req, response));
            } catch (err) {
                queryUtil.handle500(req, res, err);
            }
        };
    }

    static handle500(req, res, err) {
        logger.error(JSON.stringify({ message: err.message, stack: err.stack }, null, 4))
        let stack = [];
        err.stack.split('\n').forEach((line) => {
            stack.push(line);
        });
        res.status(500).send({
            url: req.originalUrl,
            message: err.message,
            internalError: stack,
        });
    }

    /**
     * Format response and add event data
     * @param {object} req Express request object
     * @param {object} [response]
     * @returns {Promise<object>}
     */
    static async prepareResponse(req, response = {}) {
        return response
    }

    /**
     * @param {function(*, *): *} handlerFn
     * @returns {(function(*=, *=, *=): Promise<void>)|*}
     */
    static makeMiddleware(handlerFn) {
        return async (req, res, next) => {
            try {
                await handlerFn(req, res);
                next();
            } catch (err) {
                queryUtil.handle500(req, res, err);
            }
        };
    }

    static toInt(val) {
        return val ? parseInt(val) : null;
    }

    static toFloat(val) {
        return val ? parseFloat(val) : null;
    }

    static toBoolean(val) {
        let result = null;
        switch (val) {
            case 'true':
                result = true;
                break;
            case 'false':
                result = false;
                break;
        }
        return result;
    }

    static toObject(val) {
        return (val && JSON.parse(decodeURIComponent(val))) || null;
    }
}
module.exports = queryUtil;
