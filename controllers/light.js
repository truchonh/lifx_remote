const _ = require('lodash')
const Cron = require('cron').CronJob
const logger = require('../utils/simpleLogger');
const lifxApi = require('./lifxApi');

let currentConfig = null
let wakeUpSequenceCron = null

const lightController = {
    /**
     * @returns {Promise<{ power: boolean, color: { brightness: number, kelvin: number } }>}
     */
    async getState() {
        const state = await lifxApi.getState();
        currentConfig = {
            power,
            color: { brightness, kelvin }
        } = state
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
            duration: config.power ? 250 : 500,
            color: {
                ...config.color
            }
        }

        if (config.power) {
            await Promise.all([
                lifxApi.setPower({ power: true, duration: params.duration }),
                new Promise(resolve => setTimeout(resolve, params.duration))
            ])
            await lifxApi.setColor(params)
        } else {
            await lifxApi.setPower({ power: false, duration: params.duration })
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

        try {
            await lifxApi.setColor({ color: { brightness: 0, kelvin: 1500 } })
            await lifxApi.setPower({ power: true })
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

            let config = this._calculateLightValue(sequence)
            await lifxApi.setColor({
                duration: 9.5 * 1000,
                color: {
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
