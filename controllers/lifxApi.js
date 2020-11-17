const superagent = require('superagent')

class lifxApi {
    static async getState() {
        const res = await superagent
            .put(`http://${process.env.LIFX_HOSTNAME}/v1/lifx/command`)
            .send({
                command: 'query',
                args: {
                    pkt_type: 'GetColor'
                }
            })

        const devices = Object.values(res.body.results)
        if (devices.length) {
            const device = devices[0]
            return {
                power: !!device.power,
                color: {
                    brightness: device.brightness,
                    kelvin: device.kelvin
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
        const res = await superagent
            .put(`http://${process.env.LIFX_HOSTNAME}/v1/lifx/command`)
            .send({
                command: 'set',
                args: {
                    pkt_type: 'SetLightPower',
                    pkt_args: {
                        duration: duration / 1000,
                        power: power && 1 || 0
                    }
                }
            })

        const devices = Object.values(res.body.results)
        return devices.length && devices[0] === 'ok'
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
        const res = await superagent
            .put(`http://${process.env.LIFX_HOSTNAME}/v1/lifx/command`)
            .send({
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

        const devices = Object.values(res.body.results)
        return devices.length && devices[0] === 'ok'
    }
}

module.exports = lifxApi;