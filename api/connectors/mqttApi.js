const mqtt = require('async-mqtt')
const { xyBriToRgb } = require('cie-rgb-color-converter')
const lightUtil = require('../utils/lightUtil')

class mqttApi {
    static async getState(device) {
        const state = await this._query(device, 'get')
        if (state) {
            return {
                power: state.state,
                color: {
                    brightness: state.brightness / 254,
                    kelvin: lightUtil.convertToKelvin(state.color_temp),
                    rgb: xyBriToRgb(state.color.x, state.color.y, state.brightness)
                }
            }
        } else {
            return null
        }
    }

    /**
     * Turn the light on or of
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
        if (kelvin && kelvin >= 2000) {
            config.color_temp = lightUtil.convertToMqtt(kelvin)
        }
        if (kelvin && kelvin < 2000) {
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

        const responsePromise = this._subscribe(client, topic)
        await client.publish(`zigbee2mqtt/${topic}/${verb}`, JSON.stringify(payload))
        const response = await responsePromise
        return JSON.parse(response || '{}')
    }

    static async _subscribe(client, topic, closeOnResponse = true) {
        const timeout = 5000
        let hasResolved = false

        return new Promise(async (resolve, reject) => {
            setTimeout(() => {
                !hasResolved && reject(new Error(`subscribe response has timed out. (${timeout}ms)`))
                hasResolved = true
            }, timeout)
            client.on('message', async (_topic, message) => {
                closeOnResponse && await client.end()
                !hasResolved && resolve(message.toString())
                hasResolved = true
            })
            await client.subscribe(`zigbee2mqtt/${topic}`)
        })
    }

    static async _getClient() {
        return mqtt.connectAsync('mqtt://192.168.0.44:1883')
    }
}

module.exports = mqttApi