const _ = require('lodash')
const Lifx = require('node-lifx-lan')
const Cron = require('cron').CronJob
const logger = require('../utils/simpleLogger');

let currentConfig = null
let wakeUpSequenceCron = null

let _device = null

setInterval(async () => {
    _device = null;
    await lightController._getDevice()
}, 60*1000)

const lightController = {
    async _getDevice() {
        if (!_device) {
            try {
                const devices = await Lifx.discover()
                if (devices.length === 1) {
                    _device = devices[0]
                } else {
                    logger.log('No device detected on the network.')
                }
            } catch (err) {
                logger.error('Error while searching for the device: '+ JSON.stringify({
                    message: err.message, stack: err.stack
                }, null, 4))
            }
        }
        return _device
    },

    /**
     * @returns {Promise<{ power: boolean, color: { brightness: number, kelvin: number } }>}
     */
    async getState() {
        const device = await this._getDevice()

        if (device === null) {
            currentConfig = null
        } else {
            const state = await device.getLightState()
            currentConfig = {
                power,
                color: { brightness, kelvin }
            } = state
        }

        return currentConfig
    },

    isWakeUpSequenceRunning() {
        return !!wakeUpSequenceCron
    },

    /**
     * @param {object} config
     * @param {boolean} config.power
     * @param {object} config.color
     * @param {number} config.color.brightness
     * @param {number} config.color.kelvin
     * @returns {Promise<void>}
     */
    async setState(config) {
        const params = {
            duration: config.power ? 400 : 1200,
            color: {
                red:1, green: 1, blue: 1,
                ...config.color
            }
        }
        const device = await this._getDevice()

        if (config.power) {
            device && await device.turnOn(params)
        } else {
            device && await device.turnOff(params)
        }

        currentConfig = {
            power: config.power,
            color: {
                ...config.color
            }
        }
    },

    async startWakeUpSequence(sequence) {
        logger.log(`Starting the alarm sequence !`)

        let device;
        try {
            device = await this._getDevice()
            if (device === null) {
                logger.error('Alarm sequence stopped, no device found.')
                return
            }

            await device.turnOn({
                duration: 0,
                color: {
                    red:1, green: 1, blue: 1,
                    brightness: 0,
                    kelvin: 1500
                }
            })
        } catch (err) {
            logger.error(JSON.stringify({ message: err.message, stack: err.stack }, null, 4))
            this._stopWakeSequence()
        }

        this._stopWakeSequence()

        wakeUpSequenceCron = new Cron('*/10 * * * * *', async () => {
            if (this._isSequenceDone(sequence)) {
                wakeUpSequenceCron.stop()
                wakeUpSequenceCron = null
            }

            device = await this._getDevice()

            let config = this._calculateLightValue(sequence)
            await device.setColor({
                duration: 9.5 * 1000,
                color: {
                    red:1, green: 1, blue: 1,
                    ...config
                }
            })
        })
        wakeUpSequenceCron.start()
    },

    _stopWakeSequence() {
        wakeUpSequenceCron && wakeUpSequenceCron.stop()
        wakeUpSequenceCron = null
    },

    _calculateLightValue(sequence) {
        const now = new Date()
        const nowMinutes = (now.getHours() * 60) + now.getMinutes() + (now.getSeconds() / 60)

        let sequenceStartMinutes = 0
        // if null, then now is before the first sequence item
        const sequenceStart = _.findLast(sequence, _item => {
            const timePart = _item.time.split(':').map(_part => parseInt(_part))
            sequenceStartMinutes = (timePart[0] * 60) + timePart[1]
            return sequenceStartMinutes <= nowMinutes
        })
        let sequenceEndMinutes = 0
        // if null, then now is after the last sequence item
        const sequenceEnd = _.find(sequence, _item => {
            const timePart = _item.time.split(':').map(_part => parseInt(_part))
            sequenceEndMinutes = (timePart[0] * 60) + timePart[1]
            return nowMinutes <= sequenceEndMinutes
        })

        if (!sequenceStart) {
            return {
                brightness: _.first(sequence).brightness,
                kelvin: Math.round(_.first(sequence).kelvin)
            }
        } else if (!sequenceEnd) {
            return {
                brightness: _.last(sequence).brightness,
                kelvin: Math.round(_.last(sequence).kelvin)
            }
        }

        const periodLength = sequenceEndMinutes - sequenceStartMinutes
        const periodRatio = periodLength === 0 ? 1 : (nowMinutes - sequenceStartMinutes) / periodLength
        const calculatedBrightness = ((sequenceEnd.brightness - sequenceStart.brightness) * periodRatio) + sequenceStart.brightness
        const calculatedKelvin = ((sequenceEnd.kelvin - sequenceStart.kelvin) * periodRatio) + sequenceStart.kelvin

        return {
            brightness: calculatedBrightness,
            kelvin: Math.round(calculatedKelvin)
        }
    },

    _isSequenceDone(sequence) {
        const now = new Date()
        const nowMinutes = (now.getHours() * 60) + now.getMinutes()

        const timePart = _.last(sequence).time.split(':').map(_part => parseInt(_part))
        const sequenceMinutes = (timePart[0] * 60) + timePart[1]

        return nowMinutes >= sequenceMinutes
    }
}

module.exports = lightController
