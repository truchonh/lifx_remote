const Lifx = require('node-lifx-lan')

let currentConfig = null;

module.exports = {
    /**
     * @returns {Promise<{ power: boolean, color: { brightness: number, kelvin: number } }>}
     */
    async getState() {
        const devices = await Lifx.discover()

        if (devices.length < 1) {
            currentConfig = null;
        } else {
            const state = await devices[0].getLightState()
            currentConfig = {
                power, color: { brightness, kelvin }
            } = state
        }

        return currentConfig
    },

    /**
     * @param {object} config
     * @param {boolean} config.power
     * @param {object} config.color
     * @param {number} config.color.brightness
     * @param {number} config.color.kelvin
     * @returns {Promise<void>}
     */
    async setState(config) {
        const params = {
            duration: 500,
            color: {
                red: 1,
                green: 1,
                blue: 1,
                ...config.color
            }
        }
        const devices = await Lifx.discover()

        if (config.power) {
            (devices.length > 0) && await devices[0].turnOn(params)
        } else {
            (devices.length > 0) && await devices[0].turnOff(params)
        }
    }
};