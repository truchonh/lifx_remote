const mqttApi = require('../connectors/mqttApi')
const { lightValueTimeMap } = require('../../config/config')
const lightUtil = require('../utils/lightUtil')

const TEMP_MIN = 2204
const TEMP_MAX = 4000
const DIMMER_STEP = 0.1

module.exports.remoteHandler = class {
    constructor(mainDevice, secondaryDevice) {
        mqttApi.listenToRemote('main_switch', (message) => handleRemoteMessage(message, mainDevice, secondaryDevice))
    }
}
module.exports.commands = {
    setNightLights: 'setNightLights',
    globalOff: 'globalOff',
    toggleWithLightColorMap: 'toggleWithLightColorMap',
    setMaxBrightness: 'setMaxBrightness',
}

const recentLightStateMap = new Map()
let holdCounter = 0
async function handleRemoteMessage(message, mainDevice, secondaryDevice) {
    const data = JSON.parse(message || '{}')
    data.action && console.log(data.action)

    switch (data?.action) {
    // ON button
        case 'on_press_release':
            return await toggleWithLightColorMap(mainDevice)
        case 'on_hold':
            return await setMaxBrightness(mainDevice)

    // UP button
        case 'up_press_release':
            return await setNightLights()
        case 'up_press':
            return await saveState(mainDevice)
        case 'up_hold':
            holdCounter++
            return await setDimmerValue(mainDevice)
        case 'up_hold_release':
            return resetState(mainDevice)

    // DOWN button
        case 'down_press_release':
            return await globalOff()
        case 'down_press':
            return await saveState(mainDevice)
        case 'down_hold':
            holdCounter--
            return await setDimmerValue(mainDevice)
        case 'down_hold_release':
            return resetState(mainDevice)

    // HUE button
        case 'off_press_release':
            return await toggleWithLightColorMap(secondaryDevice)
    }
}

const remoteCommandMap = {
    setNightLights,
    globalOff,
    toggleWithLightColorMap,
    setMaxBrightness,
}

async function setNightLights() {
    await mqttApi.setColor('bedroom', {
        color: { brightness: 0.01, kelvin: 1200 },
        duration: 250,
        power: 'ON'
    })
    await mqttApi.setColor('kitchen', {
        color: { brightness: 0.01, kelvin: 2200 },
        duration: 250,
        power: 'ON'
    })
}

async function globalOff() {
    await mqttApi.setColor('all', {
        color: {},
        duration: 250,
        power: 'OFF'
    })
}

async function toggleWithLightColorMap(device) {
    await mqttApi.setColor(device, {
        ...lightValueTimeMap[new Date().getHours()],
        duration: 250,
        power: 'TOGGLE',
    })
}

async function setMaxBrightness(device) {
    await mqttApi.setColor(device, {
        color: { brightness: 1, kelvin: TEMP_MAX },
        duration: 250,
        power: 'ON',
    })
}

async function saveState(device) {
    const state = await mqttApi.getState(device)
    recentLightStateMap.set(device, state?.color)
}

function resetState(device) {
    holdCounter = 0
    recentLightStateMap.set(device, null)
}

async function setDimmerValue(device) {
    let baseState = recentLightStateMap.get(device)
    if (!baseState) {
        return
    }

    const relativeTemperature = (baseState.kelvin - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)
    const color = lightUtil.logarithmicColorScale(
        Math.max(0.01, Math.min(relativeTemperature + (DIMMER_STEP * holdCounter), 1)),
        TEMP_MIN,
        TEMP_MAX
    )
    await mqttApi.setColor(device, {
        color,
        duration: 750,
        power: 'ON'
    })
}
