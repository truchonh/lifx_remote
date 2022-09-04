const {Router} = require('express')
const queryUtil = require('../utils/queryUtil')


class BaseRoute {
    /**
     * @protected
     * @type {Router}
     */
    static router = null
    /**
     * @protected
     * @type {queryUtil}
     */
    static handlerFactory = null

    static getRouter() {
        this.router = Router({})
        this.handlerFactory = queryUtil.getHandlerFactory(this)

        return this.router
    }
}

module.exports = BaseRoute
