const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const lightController = require('./controllers/fakeLight')

const HTTP_PORT = 9999



class api {
    static async start() {
        const app = express()

        app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
        app.use(bodyParser.json({ limit: '5mb' }));

        // serve the client
        app.use(express.static(path.join(__dirname, 'client', 'dist')))



        // toggle the light on and off without changing the configuration
        app.get('/api/toggle', async (req, res) => {
            console.log('toggle')
            const state = await lightController.getState()

            if (state) {
                state.power = !state.power
                await lightController.setState(state)
            }

            res.send({
                state
            })
        })

        app.get('/api/state', async (req, res) => {
            console.log('getState')
            const state = await lightController.getState()
            res.send({
                state
            })
        })

        app.put('/api/state', async (req, res) => {
            console.log('setState')
            console.log(req.body)
            await lightController.setState(req.body)
            res.send({})
        })



        await app.listen(HTTP_PORT)
    }
}

api.start().catch(console.error)
