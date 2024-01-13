const mqttApi = require('../connectors/mqttApi')
const { lightValueTimeMap } = require('../../config/config')
const lightUtil = require('./lightUtil')

const TEMP_MIN = 2204
const TEMP_MAX = 4000
const DIMMER_STEP = 0.1

const recentLightStateMap = new Map()
let holdCounter = 0

const commands = {
    setNightLights: 'setNightLights',
    globalOff: 'globalOff',
    toggleWithLightColorMap: 'toggleWithLightColorMap',
    setMaxBrightness: 'setMaxBrightness',
}
module.exports.commands = commands

const presetFunctions = {
    dimmerUp: 'dimmerUp',
    dimmerDown: 'dimmerDown',
};
module.exports.presetFunctions = presetFunctions


const remoteCommandMap = {
    setNightLights,
    globalOff,
    toggleWithLightColorMap,
    setMaxBrightness,
}
module.exports.remoteCommandMap = remoteCommandMap

const remotePresetMap = {
    dimmerUp: dimmerUpHandler,
    dimmerDown: dimmerDownHandler,
}
module.exports.remotePresetMap = remotePresetMap

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

async function dimmerUpHandler(action, device) {
    switch (action) {
        case 'press':
            return await saveState(device)
        case 'hold':
            holdCounter++
            return await setDimmerValue(device)
        case 'hold_release':
            return resetState(device)
    }
}

async function dimmerDownHandler(action, device) {
    switch (action) {
        case 'press':
            return await saveState(device)
        case 'hold':
            holdCounter--
            return await setDimmerValue(device)
        case 'hold_release':
            return resetState(device)
    }
}
