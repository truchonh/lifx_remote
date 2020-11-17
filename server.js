const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const util = require('util')
const fs = require('fs')
const fs_readFile = util.promisify(fs.readFile)
const fs_writeFile = util.promisify(fs.writeFile)
const Cron = require('cron').CronJob
const _ = require('lodash')
const lightController = require('./controllers/light')
const logger = require('./utils/simpleLogger');

const defaults = {
    ALARM_CONFIG: {
        cron: '15 8 * * *',
        sequence: [
            {
                time: '8:15',
                brightness: 0.01,
                kelvin: 1500
            },
            {
                time: '8:18',
                brightness: 0.10,
                kelvin: 2500
            },
            {
                time: '8:26',
                brightness: 0.3,
                kelvin: 3100
            },
            {
                time: '8:30',
                brightness: 0.65,
                kelvin: 3400
            }
        ]
    }
}
const lightValueTimeMap = {
    0: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
    1: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
    2: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
    3: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
    4: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
    5: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
    6: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
    7: { power: true, color: { brightness: 0.76, kelvin: 3400 } },
    8: { power: true, color: { brightness: 0.76, kelvin: 3400 } },
    9: { power: true, color: { brightness: 0.76, kelvin: 3400 } },
    10: { power: true, color: { brightness: 1, kelvin: 4000 } },
    11: { power: true, color: { brightness: 1, kelvin: 4000 } },
    12: { power: true, color: { brightness: 1, kelvin: 4000 } },
    13: { power: true, color: { brightness: 1, kelvin: 4000 } },
    14: { power: true, color: { brightness: 1, kelvin: 4000 } },
    15: { power: true, color: { brightness: 1, kelvin: 4000 } },
    16: { power: true, color: { brightness: 1, kelvin: 4000 } },
    17: { power: true, color: { brightness: 1, kelvin: 4000 } },
    18: { power: true, color: { brightness: 0.68, kelvin: 3200 } },
    19: { power: true, color: { brightness: 0.68, kelvin: 3200 } },
    20: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
    21: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
    22: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
    23: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
}

let alarmCron = null


class api {
    static async start() {
        const app = express()

        app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
        app.use(bodyParser.json({ limit: '5mb' }));

        // serve the client
        app.use(express.static(path.join(__dirname, 'client', 'dist')))

        // restart the alarm cron, if its enabled
        const alarmConfig = await this._getAlarmConfig()
        if (!_.isEmpty(alarmConfig)) {
            alarmCron = new Cron(alarmConfig.cron, () => {
                lightController.startWakeUpSequence(alarmConfig.sequence)
            })
            alarmCron.start()
            logger.log('started the alarm cron:')
            logger.log(JSON.stringify(alarmConfig, null, 4));
        }

        // toggle the light on and off and set the luminosity to an appropriate value for the time of day
        app.get('/api/toggle', async (req, res) => {
            if (lightController.isWakeUpSequenceRunning()) {
                return res.status(401).end()
            }

            const state = await lightController.getState()

            if (state && state.power) {
                state.power = false
                await lightController.setState(state)
            } else {
                await lightController.setState(lightValueTimeMap[new Date().getHours()])
            }

            res.send({ state })
            logger.log(JSON.stringify(state, null, 4))
        })

        app.get('/api/state', async (req, res) => {
            const state = await lightController.getState()
            res.send({
                state
            })
        })
        app.put('/api/state', async (req, res) => {
            if (lightController.isWakeUpSequenceRunning()) {
                return res.status(401).end()
            }

            logger.log(JSON.stringify(req.body, null, 4))
            await lightController.setState(req.body)
            res.send()
        })

        app.get('/api/alarm', async (req, res) => {
            res.send(await this._getAlarmConfig())
        })
        app.put('/api/alarm', async (req, res) => {
            const config = req.body
            const validationError = this._validateAlarmConfig(config)
            if (!validationError) {

                await this._setAlarmConfig(config)
                logger.log('New alarm config: ');
                logger.log(JSON.stringify(config, null, 4));

                if (alarmCron) {
                    alarmCron.stop()
                }
                alarmCron = new Cron(config.cron, () => {
                    lightController.startWakeUpSequence(config.sequence)
                })
                alarmCron.start()

                res.send()

            } else {
                logger.log('Invalid alarm config: '+ validationError);
                res.status(400).send({ message: 'Invalid alarm config: '+ validationError })
            }
        })

        await app.listen(process.env.PORT)
    }
    static _validateAlarmConfig(config) {
        if (typeof config.desiredWakeTime !== 'string') {
            return 'Desired wake time missing'
        } else if (config.desiredWakeTime.split(':').length !== 2) {
            return 'Invalid desired wake time value'
        } else if (_.isEmpty(config.alarmDays) || !_.isArray(config.alarmDays)) {
            return 'Empty or missing alarm days'
        } else if (typeof config.cron !== 'string') {
            return 'Alarm cron missing or invalid'
        } else if (_.isEmpty(config.sequence) || !_.isArray(config.sequence)) {
            return 'Empty or missing wake up sequence'
        } else if (
            config.sequence.some(_item => {
                if (typeof _item.time !== 'string') {
                    return true
                } else if (typeof _item.brightness !== 'number') {
                    return true
                } else if (typeof _item.kelvin !== 'number') {
                    return true
                }
                return false
            })
        ) {
            return 'A wake up sequence value is invalid'
        }
    }

    static async _getAlarmConfig() {
        try {
            const configData = await fs_readFile(path.join(__dirname, 'config.json'))
            return {
                ...defaults.ALARM_CONFIG,
                ...JSON.parse(configData)
            }
        } catch (err) {
            return {}
        }
    }

    static async _setAlarmConfig(config) {
        const configData = JSON.stringify(config)
        await fs_writeFile(path.join(__dirname, 'config.json'), configData)
    }
}

api.start().catch((err) => {
    logger.error(JSON.stringify({ message: err.message, stack: err.stack }, null, 4))
})
