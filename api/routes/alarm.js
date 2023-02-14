const alarmCtrl = require('../controller/alarm')
const BaseRoute = require('./baseRoute')
const logger = require('../utils/simpleLogger')
const alarmUtil = require('../utils/alarmUtil')
const mqttApi = require('../connectors/mqttApi')

class alarmRoute extends BaseRoute {
    static timeoutMap = new Map()

    static getRouter() {
        super.getRouter()

        this.router.route('/coffee')
            .get(this.handlerFactory.makeHandler(this._getCoffeeState))
            .put(this.handlerFactory.makeHandler(this._setCoffeeState))

        this.router.route('/cancel').get(this.handlerFactory.makeHandler(this._cancelAlarm));

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

    static async _cancelAlarm(req, res) {
        alarmCtrl.stopWakeSequence();
        await mqttApi.setPower('bedroom', { power: 'OFF' })
    }

    static async _getCoffeeState(req, res) {
        return alarmCtrl.getCoffeeState()
    }

    static async _setCoffeeState(req, res) {
        this._clearCoffeeAlarmReminders()

        if (req.body?.power === true) {
            await alarmCtrl.initCoffee()
            // setup visual alarms
            this.timeoutMap.set('25min', setTimeout(() => this._lightNotification(), 1000*60*25))
            this.timeoutMap.set('45min', setTimeout(() => this._lightNotification(2), 1000*60*45))
            this.timeoutMap.set('50min', setTimeout(() => this._lightNotification(3), 1000*60*50))
            this.timeoutMap.set('shutdown', setTimeout(() => alarmCtrl.stopCoffee(), 1000*60*60))
        } else {
            await alarmCtrl.stopCoffee()
        }
    }

    static async _lightNotification(count = 1) {
        try {
            const currentState = await mqttApi.getState('kitchen')
            for (let i = 0; i < count; i++) {
                const isAlreadyOn = currentState.power === 'ON' && currentState.color.brightness > 0.5;
                await mqttApi.setColor('kitchen', {
                    color: { kelvin: 6500, brightness: 1 },
                    power: isAlreadyOn ? 'OFF' : 'ON',
                    duration: 0
                })
                await new Promise(resolve => setTimeout(resolve, 200))
                await mqttApi.setColor('kitchen', {
                    color: currentState.color,
                    power: currentState.power,
                    duration: 0
                })
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        } catch (e) {
            // Exceptions have to be handled here because the handlerFactory doesn't catch them from here.
            // Just kinda do nothing for now. Surely future me will improve this some day. :)
            console.warn(e)
        }
    }

    static _clearCoffeeAlarmReminders() {
        for (const timeout of this.timeoutMap.values()) {
            clearTimeout(timeout)
        }
    }
}

module.exports = alarmRoute
