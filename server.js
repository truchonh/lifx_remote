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

const HTTP_PORT = 29999

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
            console.log('started the alarm cron: \n'+ JSON.stringify(alarmConfig.sequence, null, 4))
        }


        // toggle the light on and off without changing the configuration
        app.get('/api/toggle', async (req, res) => {
            if (lightController.isWakeUpSequenceRunning()) {
                return res.status(401).end()
            }

            const state = await lightController.getState()

            if (state) {
                state.power = !state.power
                await lightController.setState(state)
            }

            res.send({ state })
            console.log(state)
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

            console.log(req.body)
            await lightController.setState(req.body)
            res.send()
        })

        app.get('/api/alarm', async (req, res) => {
            res.send(await this._getAlarmConfig())
        })
        app.put('/api/alarm', async (req, res) => {
            const config = req.body
            if (this._validateAlarmConfig(config)) {

                await this._setAlarmConfig(config)

                if (alarmCron) {
                    alarmCron.stop()
                }
                alarmCron = new Cron(alarmConfig.cron, () => {
                    lightController.startWakeUpSequence(alarmConfig.sequence)
                })
                alarmCron.start()

                res.send()

            } else {
                res.status(400).send({ message: 'Invalid alarm config.' })
            }
        })

        await app.listen(HTTP_PORT)
    }

    static _validateAlarmConfig(config) {
        if (typeof config.cron !== 'string') {
            return false
        } else if (_.isEmpty(config.sequence)) {
            return false
        } else if (!_.isArray(config.sequence)) {
            return false
        } else if (
            config.sequence.some(_item => {
                if (typeof _item.time !== 'string') {
                    return false
                } else if (typeof _item.brightness !== 'number') {
                    return false
                } else if (typeof _item.kelvin !== 'number') {
                    return false
                }
                return true
            })
        ) {
            return false
        }
        return true
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

api.start().catch(console.error)
