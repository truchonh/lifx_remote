const mqttApi = require('../connectors/mqttApi')
const { lightValueTimeMap } = require('../../config/config')

module.exports.start = async function () {
    await mqttApi.listenToRemote('main_switch', handleRemoteMessage)
}

async function handleRemoteMessage(message) {
    const data = JSON.parse(message || '{}')
    data.action && console.log(data.action)
    switch (data?.action) {
        case 'on_press_release':
            await mqttApi.setColor('kitchen', {
                ...lightValueTimeMap[new Date().getHours()],
                duration: 250,
                power: 'TOGGLE',
            })
            break
        case 'on_hold':
            await mqttApi.setColor('kitchen', {
                color: { brightness: 1, kelvin: 4100 },
                duration: 250,
                power: 'ON',
            })
            break
        case 'up_press_release':
            await mqttApi.setColor('bedroom', {
                ...lightValueTimeMap[new Date().getHours()],
                duration: 250,
                power: 'TOGGLE',
            })
            break
        case 'down_press_release':
            await mqttApi.setColor('night_lights', {
                color: { brightness: 0.01, kelvin: 2200 },
                duration: 250,
                power: 'ON'
            })
            break
        case 'off_press_release':
            await mqttApi.setColor('all', {
                color: {},
                duration: 250,
                power: 'OFF'
            })
            break
    }
}
