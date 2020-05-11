let currentConfig = {
    power: false,
    color: {
        brightness: 0.6,
        kelvin: 3500
    }
};

module.exports = {
    /**
     * @returns {Promise<{ power: boolean, color: { brightness: number, kelvin: number } }>}
     */
    async getState() {
        return new Promise(resolve => {
            setTimeout(() => resolve(currentConfig), 250)
        })
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
        currentConfig = config
        return new Promise(resolve => {
            setTimeout(resolve, 400)
        })
    }
};