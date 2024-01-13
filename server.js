const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const logger = require('./api/utils/simpleLogger')
const alarmCtrl = require('./api/controller/alarm')
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
        await alarmCtrl.restartCron()
        await initRemoteController('main_switch', {
            on: {
                press_release: {
                    name: commands.toggleWithLightColorMap,
                    arg: 'kitchen',
                },
                hold: {
                    name: commands.setMaxBrightness,
                    arg: 'kitchen',
                },
            },
            up: {
                press_release: {
                    name: commands.setNightLights,
                },
                [presetFunctions.dimmerUp]: {
                    device: 'kitchen'
                },
            },
            down: {
                press_release: {
                    name: commands.globalOff,
                },
                [presetFunctions.dimmerDown]: {
                    device: 'kitchen'
                },
            },
            off: {
                press_release: {
                    name: commands.toggleWithLightColorMap,
                    arg: 'bedroom',
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
