const mqtt = require('async-mqtt')
const { xyBriToRgb } = require('cie-rgb-color-converter')
const lightUtil = require('../utils/lightUtil')
const simpleLogger = require('../utils/simpleLogger')

let _client = null
let messageCallback = null

class mqttApi {
    static async getState(device) {
        const state = await this._query(device, 'get', { state: '' })
        if (state) {
            return {
                power: state.state,
                color: {
                    brightness: state.brightness / 254,
                    kelvin: lightUtil.toReciprocalMegakelvin(state.color_temp),
                    rgb: xyBriToRgb(state.color.x, state.color.y, state.brightness)
                }
            }
        } else {
            return null
        }
    }

    /**
     * Turn the light on or off
     * @param {string} device
     * @param {'OFF'|'ON'|'TOGGLE'} power
     * @param {number} [duration] Duration in ms
     * @returns {Promise<boolean>}
     */
    static async setPower(device, { power, duration = 0 }) {
        await this._query(device, 'set', {
            state: power,
            transition: duration / 1000
        })
        return true
    }

    /**
     * @param {string} device
     * @param {'OFF'|'ON'|'TOGGLE'} power
     * @returns {Promise<boolean>}
     */
    static async setSwitchState(device, { power }) {
        await this._query(device, 'set', {
            state: power,
        })
        return true
    }

    /**
     * Set the color. This command does NOT turn on the light implicitly
     * @param {string} device
     * @param {'OFF'|'ON'|'TOGGLE'} power
     * @param {number} [duration] Duration in ms
     * @param {number} [rgb]
     * @param {number} brightness
     * @param {number} kelvin
     * @returns {Promise<boolean>}
     */
    static async setColor(device, { power, color: { rgb, brightness, kelvin }, duration = 0 }) {
        let config = {
            state: power,
            brightness: brightness * 254,
            transition: duration / 1000
        }
        if (kelvin && kelvin >= 2200) {
            config.color_temp = lightUtil.toReciprocalMegakelvin(kelvin)
        }
        if (kelvin && kelvin < 2200) {
            config.color = lightUtil.kelvinToRgb(kelvin + 400)
        } else {
            config.color = rgb
        }
        await this._query(device, 'set', config)
        return true
    }

    /**
     * Publish a message and listen for the response.
     * @param {string} topic
     * @param {string} verb
     * @param {object} [payload]
     * @private
     */
    static async _query(topic, verb, payload = {}) {
        const client = await this._getClient()

        try {
            const responsePromise = this._subscribe(client, topic)
            client.publish(`zigbee2mqtt/${topic}/${verb}`, JSON.stringify(payload))
            const response = await responsePromise
            return JSON.parse(response || '{}')
        } finally {
            messageCallback = null
        }
    }

    static async _subscribe(client, topic) {
        const timeout = 5_000
        let isDone = false

        return new Promise(async (resolve, reject) => {
            setTimeout(() => {
                !isDone && reject(new Error(`subscribe response has timed out. (${timeout}ms)`))
                isDone = true
            }, timeout)
            messageCallback = async (_topic, message) => {
                const topicSections = _topic.split('/')
                if (topicSections.includes(topic)) {
                    !isDone && resolve(message.toString())
                    isDone = true
                }
            }
            await client.subscribe(`zigbee2mqtt/${topic}`)
        })
    }

    static async _getClient() {
        if (_client === null) {
            _client = await mqtt.connectAsync('mqtt://server.lan:1883')
            _client.on('error', (err) => simpleLogger.error('MQTT client error:', err))
            _client.on('close', () => simpleLogger.log('MQTT client closed.'))
            _client.on('message', (topic, message) => this._onMessage(topic, message))
        }
        return _client
    }

    static _onMessage(topic, message) {
        if (messageCallback) {
            messageCallback(topic, message)
        }
    }

    static async listenToRemote(topic, onMessage) {
        const client = await this._getClient()
        client.on('message', async (_topic, message) => {
            if (_topic.includes(topic)) {
                onMessage(message.toString());
            }
        })
        await client.subscribe(`zigbee2mqtt/${topic}`)
    }
}

module.exports = mqttApi
