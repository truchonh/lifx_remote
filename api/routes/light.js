const _ = require('lodash')
const logger = require('../utils/simpleLogger')
const mqttApi = require('../connectors/mqttApi')
const BaseRoute = require('./baseRoute')
const alarmCtrl = require('../controller/alarm')
const { lightValueTimeMap, defaultDevice } = require('../../config/config')

let currentConfig = null

class lightRoute extends BaseRoute {
    static getRouter() {
        super.getRouter()

        this.router.route('/toggle/:device?').get(this.handlerFactory.makeHandler(this._toggle))
        this.router.route('/state/:device?')
            .get(this.handlerFactory.makeHandler(this._getState))
            .put(this.handlerFactory.makeHandler(this._setState))

        return this.router
    }

    static async _toggle(req, res) {
        if (alarmCtrl.isWakeUpSequenceRunning()) {
            throw new Error(`Alarm sequence is running.`)
        }

        await mqttApi.setColor(req.params.device || defaultDevice, {
            ...lightValueTimeMap[new Date().getHours()],
            duration: 250,
            power: 'TOGGLE',
        })

        return this._returnState(req.params.device || 'kitchen')
    }

    static async _getState(req, res) {
        return this._returnState(req.params.device || 'kitchen')
    }

    static async _returnState(device, newState) {
        if (newState === undefined) {
            newState = await mqttApi.getState(device)
        }

        logger.log(JSON.stringify(newState, null, 4))
        if (newState) {
            currentConfig = newState
            return {
                ...currentConfig,
                power: currentConfig.power === 'ON'
            }
        } else {
            return null
        }
    }

    static async _setState(req, res) {
        if (alarmCtrl.isWakeUpSequenceRunning()) {
            throw new Error(`Alarm sequence is running.`)
        }

        await mqttApi.setColor(req.params.device || defaultDevice, {
            ...req.body,
            duration: 250,
            power: req.body.power ? 'ON' : 'OFF'
        })
    }
}

module.exports = lightRoute
