const mqttApi = require('../connectors/mqttApi')
const logger = require('../utils/simpleLogger')
const {CronJob: Cron} = require('cron')
const _ = require('lodash')
const path = require('path')
const util = require('util')
const fs = require('fs')
const { defaultAlarm: defaults } = require('../../config/config')
const alarmUtil = require('../utils/alarmUtil')
const fs_readFile = util.promisify(fs.readFile)
const fs_writeFile = util.promisify(fs.writeFile)

let alarmCron = null
let coffeeOffCron = null
let wakeUpSequenceCron = null
let coffeeOnTimestamp = null

class alarmController {
    static isWakeUpSequenceRunning() {
        return !!wakeUpSequenceCron
    }

    static async restartCron() {
        const alarmConfig = await this.getAlarmConfig()
        if (!_.isEmpty(alarmConfig)) {
            alarmCron = new Cron(alarmConfig.cron, () => {
                this.startWakeUpSequence(alarmConfig.sequence)
                this.initCoffee()
            })
            alarmCron.start()
            logger.log('started the alarm cron:')
            logger.log(JSON.stringify(alarmConfig, null, 4))

            let cronSplit = alarmConfig.cron.split(' ')
            cronSplit[1] = (parseInt(cronSplit[1]) + 8) % 24
            coffeeOffCron = new Cron(cronSplit.join(' '), () => this.stopCoffee())
            coffeeOffCron.start()
        }
    }

    static async getAlarmConfig() {
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

    static async setAlarmConfig(config) {
        await this._setAlarmConfig(config)
        logger.log('New alarm config: ')
        logger.log(JSON.stringify(config, null, 4))

        if (alarmCron) {
            alarmCron.stop()
        }
        alarmCron = new Cron(config.cron, () => {
            this.startWakeUpSequence(config.sequence)
            this.initCoffee()
        })
        alarmCron.start()

        if (coffeeOffCron) {
            coffeeOffCron.stop()
        }
        let cronSplit = config.cron.split(' ')
        cronSplit[1] = (parseInt(cronSplit[1]) + 8) % 24
        coffeeOffCron = new Cron(cronSplit.join(' '), () => this.stopCoffee())
        coffeeOffCron.start()
    }

    static async initCoffee() {
        // Temporary coffee machine power on command
        logger.log('Heating up the espresso machine :)')
        await mqttApi._query('coffee', 'set', {
            state: 'ON'
        })
        coffeeOnTimestamp = new Date()
    }

    static async stopCoffee() {
        logger.log('Shutting off the espresso machine zZz')
        await mqttApi._query('coffee', 'set', {
            state: 'OFF'
        })
        coffeeOnTimestamp = null
    }

    static async getCoffeeState() {
        const onTimeMS = coffeeOnTimestamp ? new Date().getTime() - coffeeOnTimestamp.getTime() : 0
        return {
            power: !!coffeeOnTimestamp,
            powerOnTime: onTimeMS / 1000
        }
    }

    static async _setAlarmConfig(config) {
        const configData = JSON.stringify(config)
        await fs_writeFile(path.join(__dirname, 'config.json'), configData)
    }

    static stopWakeSequence() {
        wakeUpSequenceCron && wakeUpSequenceCron.stop()
        wakeUpSequenceCron = null
    }

    static async startWakeUpSequence(sequence) {
        logger.log(`Starting the alarm sequence !`)

        try {
            await mqttApi.setColor('bedroom', {
                power: 'ON',
                color: {
                    brightness: 0,
                    kelvin: 100
                }
            })
        } catch (err) {
            logger.error(JSON.stringify({ message: err.message, stack: err.stack }, null, 4))
            this.stopWakeSequence()
        }

        this.stopWakeSequence()

        wakeUpSequenceCron = new Cron('*/10 * * * * *', async () => {
            if (alarmUtil.isSequenceDone(sequence)) {
                wakeUpSequenceCron.stop()
                wakeUpSequenceCron = null
            }

            let config = alarmUtil.calculateLightValue(sequence)
            logger.log(JSON.stringify(config, null, 4))
            await mqttApi.setColor('bedroom', {
                duration: 7 * 1000,
                color: {
                    ...config
                }
            })
        })
        wakeUpSequenceCron.start()
    }
}

module.exports = alarmController
