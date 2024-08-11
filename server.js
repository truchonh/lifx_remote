const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const logger = require('./api/utils/simpleLogger')
const { initRemoteController } = require('./api/controller/remote')
const { presetFunctions, commands } = require('./api/utils/remoteConfig')

class api {
    static async start() {
        const app = express()

        app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }))
        app.use(bodyParser.json({ limit: '5mb' }))

        // serve the client
        app.use(express.static(path.join(__dirname, 'client', 'dist')))

        // restart the alarm cron, if its enabled
        // await alarmCtrl.restartCron()

        await initRemoteController('main_switch', {
            on: {
                press_release: {
                    name: commands.setWithLightColorMap,
                    arg: { device: 'kitchen', power: 'TOGGLE' },
                },
                hold: {
                    name: commands.setMaxBrightness,
                    arg: { device: 'kitchen' },
                },
            },
            up: {
                press_release: {
                    name: commands.setWithLightColorMap,
                    arg: { device: 'kitchen', power: 'ON' },
                },
                [presetFunctions.dimmerUp]: {
                    device: 'kitchen'
                },
            },
            down: {
                press_release: {
                    name: commands.setNightLights,
                },
                [presetFunctions.dimmerDown]: {
                    device: 'kitchen'
                },
            },
            off: {
                press_release: {
                    name: commands.toggleSwitch,
                    arg: 'terrarium_light',
                },
                hold: {
                    name: commands.globalOff,
                },
            },
        })
        await initRemoteController('bedroom_switch', {
            on: {
                press_release: {
                    name: commands.setWithLightColorMap,
                    arg: { device: 'bedroom', power: 'TOGGLE' },
                },
                hold: {
                    name: commands.setMaxBrightness,
                    arg: { device: 'bedroom' },
                },
            },
            up: {
                press_release: {
                    name: commands.setWithLightColorMap,
                    arg: { device: 'bedroom', power: 'ON' },
                },
                [presetFunctions.dimmerUp]: {
                    device: 'bedroom'
                },
            },
            down: {
                press_release: {
                    name: commands.setNightLights,
                },
                [presetFunctions.dimmerDown]: {
                    device: 'bedroom'
                },
            },
            off: {
                hold: {
                    name: commands.globalOff,
                },
            },
        })

        app.use('/api/alarm', require('./api/routes/alarm').getRouter())
        app.use('/api', require('./api/routes/light').getRouter())

        await app.listen(process.env.PORT)
    }
}

api.start().catch((err) => {
    logger.error(JSON.stringify({ message: err.message, stack: err.stack }, null, 4))
})
