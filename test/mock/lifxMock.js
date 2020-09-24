class Device {
    async getLightState() {
        return require('./deviceState')
    }
}

module.exports = {
    async discover() {
        return [new Device()];
    }
};