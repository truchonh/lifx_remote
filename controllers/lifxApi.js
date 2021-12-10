const superagent = require('superagent')
const logger = require('../utils/simpleLogger')

class lifxApi {
    static async getState() {
        const device = await this._query({
            command: 'query',
            args: {
                pkt_type: 'GetColor'
            }
        })

        if (device && device.payload) {
            return {
                power: !!device.payload.power,
                color: {
                    brightness: device.payload.brightness,
                    kelvin: device.payload.kelvin
                }
            }
        } else {
            return null
        }
    }

    /**
     * Turn the light on or of
     * @param {boolean} power
     * @param {number} [duration] Duration in ms
     * @returns {Promise<boolean>}
     */
    static async setPower({ power, duration = 0 }) {
        const success = await this._query({
            command: 'set',
            args: {
                pkt_type: 'SetLightPower',
                pkt_args: {
                    duration: duration / 1000,
                    level: power && 1 || 0
                }
            }
        })
        return success === 'ok'
    }

    /**
     * Set the color. This command does NOT turn on the light implicitly
     * @param {number} [duration] Duration in ms
     * @param {number} [hue]
     * @param {number} [saturation]
     * @param {number} brightness
     * @param {number} kelvin
     * @returns {Promise<boolean>}
     */
    static async setColor({ color: { hue = 0, saturation = 0, brightness, kelvin }, duration = 0 }) {
        const success = await this._query({
            command: 'set',
            args: {
                pkt_type: 'SetColor',
                pkt_args: {
                    duration: duration / 1000,
                    hue,
                    saturation,
                    brightness,
                    kelvin
                }
            }
        })
        return success === 'ok'
    }

    /**
     * Query the lifx api and handle errors (by logging and ignoring them LOL)
     * @param config
     * @returns {Promise<{ payload: { brightness: number, kelvin: number, power: number } } | string>}
     * @private
     */
    static async _query(config) {
        const res = await superagent
            .put(`http://${process.env.LIFX_HOSTNAME}/v1/lifx/command`)
            .send(config)

        const device = Object.values(res.body.results)[0]
        if (device.error) {
            logger.error(device.error)
        } else {
            return device
        }
    }
}

module.exports = lifxApi;