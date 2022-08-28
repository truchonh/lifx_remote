const mqtt = require('async-mqtt')
const logger = require('../utils/simpleLogger')
const { xyBriToRgb } = require('cie-rgb-color-converter')

class mqttApi {
    static async getState() {
        const state = await this._query('kitchen', 'get')
        if (state) {
            return {
                power: state.state,
                color: {
                    brightness: state.brightness / 254,
                    kelvin: this._convertToKelvin(state.color_temp),
                    rgb: xyBriToRgb(state.color.x, state.color.y, state.brightness)
                }
            }
        } else {
            return null
        }
    }

    /**
     * Turn the light on or of
     * @param {'OFF'|'ON'|'TOGGLE'} power
     * @param {number} [duration] Duration in ms
     * @returns {Promise<boolean>}
     */
    static async setPower({ power, duration = 0 }) {
        await this._query('group_1', 'set', {
            state: power,
            transition: duration / 1000
        })
        return true
    }

    /**
     * Set the color. This command does NOT turn on the light implicitly
     * @param {'OFF'|'ON'|'TOGGLE'} power
     * @param {number} [duration] Duration in ms
     * @param {number} [rgb]
     * @param {number} brightness
     * @param {number} kelvin
     * @returns {Promise<boolean>}
     */
    static async setColor({ power, color: { rgb, brightness, kelvin }, duration = 0 }) {
        let config = {
            state: power,
            brightness: brightness * 254,
            transition: duration / 1000
        }
        if (kelvin && kelvin >= 2000) {
            config.color_temp = this._convertToMqtt(kelvin)
        }
        if (kelvin && kelvin < 2000) {
            config.color = this._kelvinToRgb(kelvin + 400)
        } else {
            config.color = rgb
        }
        await this._query('group_1', 'set', config)
        return true
    }

    static _kelvinToRgb(kelvin) {
        const temperature = kelvin / 100

        let red = temperature <= 66
            ? 255
            : 329.698727446 * Math.pow(temperature - 60, -0.1332047592)
        let green = temperature <= 66
            ? 99.4708025861 * Math.log(temperature) - 161.1195681661
            : 288.1221695283 * Math.pow(temperature - 60, -0.0755148492)
        let blue = temperature >= 66
            ? 255
            : (temperature <= 19
                ? 0
                : 138.5177312231 * Math.log(temperature - 10) - 305.0447927307)

        return {
            r: this._truncateColorToHex(red),
            g: this._truncateColorToHex(green) * 1.22,
            b: this._truncateColorToHex(blue)
        }
    }

    static _truncateColorToHex(color) {
        if (color < 0) {
            return 0
        } else if (color > 255) {
            return 255
        } else {
            return color
        }
    }

    /**
     * mqtt saved temperature in a value between 0-500. A high number means a low kelvin value.
     * @param colorTemp
     * @private
     */
    static _convertToKelvin(colorTemp) {
        if (colorTemp > 500) {
            colorTemp = 500
        } else if (colorTemp < 154) {
            colorTemp = 154
        }

        // The Sengled light support 154-500 (2000k to 6500k)
        const MIN_TEMP = 500
        const MIN_KELVIN = 2000
        const MAX_KELVIN = 6500
        const conversionRatio = MAX_KELVIN / MIN_TEMP

        return ((MIN_TEMP - colorTemp) * conversionRatio) + MIN_KELVIN
    }

    static _convertToMqtt(colorKelvin) {
        if (colorKelvin > 6500) {
            colorKelvin = 6500
        } else if (colorKelvin < 2000) {
            colorKelvin = 2000
        }

        const MIN_TEMP = 500
        const MAX_TEMP = 154
        const MAX_KELVIN = 6500
        const conversionRatio = MAX_KELVIN / MIN_TEMP

        return Math.round(((MAX_KELVIN - colorKelvin) / conversionRatio) + MAX_TEMP)
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
