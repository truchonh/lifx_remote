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

        this.router.route('coffee')
            .get(this.handlerFactory.makeHandler(this._getCoffeeState))
            .put(this.handlerFactory.makeHandler(this._setCoffeeState))

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

    static async _getCoffeeState(req, res) {
        return alarmCtrl.getCoffeeState()
    }

    static async _setCoffeeState(req, res) {
        if (!req.body?.power) {
            await alarmCtrl.stopCoffee()
        } else {
            res.status(400).send({ message: 'Only supports power off command.' })
        }
    }
}

module.exports = alarmRoute
