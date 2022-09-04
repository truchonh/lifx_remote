const alarmCtrl = require('../controller/alarm')
const BaseRoute = require('./baseRoute')
const logger = require('../utils/simpleLogger')
const alarmUtil = require('../utils/alarmUtil')

class alarmRoute extends BaseRoute {
    static getRouter() {
        super.getRouter()

        this.router.route('/')
            .get(this.handlerFactory.makeHandler(this._get))
            .put(this.handlerFactory.makeHandler(this._put))

        return this.router
    }

    static async _get() {
        return alarmCtrl.getAlarmConfig()
    }

    static async _put(req, res) {
        const config = req.body
        const validationError = alarmUtil.validateConfig(config)

        if (validationError) {
            logger.log('Invalid alarm config: '+ validationError)
            res.status(400).send({ message: 'Invalid alarm config: '+ validationError })
        } else {
            await alarmCtrl.setAlarmConfig(config)
        }
    }
}

module.exports = alarmRoute
