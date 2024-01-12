const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const logger = require('./api/utils/simpleLogger')
const alarmCtrl = require('./api/controller/alarm')
const { remoteHandler, commands } = require('./api/controller/remote')

class api {
    static async start() {
        const app = express()

        app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }))
        app.use(bodyParser.json({ limit: '5mb' }))

        // serve the client
        app.use(express.static(path.join(__dirname, 'client', 'dist')))

        // restart the alarm cron, if its enabled
        await alarmCtrl.restartCron()
        new remoteHandler('kitchen')

        app.use('/api/alarm', require('./api/routes/alarm').getRouter())
        app.use('/api', require('./api/routes/light').getRouter())

        await app.listen(process.env.PORT)
    }
}

api.start().catch((err) => {
    logger.error(JSON.stringify({ message: err.message, stack: err.stack }, null, 4))
})
