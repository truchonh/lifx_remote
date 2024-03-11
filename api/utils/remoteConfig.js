const mqttApi = require('../connectors/mqttApi')
const { lightValueTimeMap } = require('../../config/config')
const lightUtil = require('./lightUtil')
const alarmCtrl = require('../controller/alarm');

const DEVICE_CONFIG = {
    bedroom: {
        TEMP_MIN: 2010,
        TEMP_MAX: 5000
    },
    kitchen: {
        TEMP_MIN: 2204,
        TEMP_MAX: 4000
    }
};
const DIMMER_STEP = 0.1

const recentLightStateMap = new Map()
let holdCounter = 0

const commands = {
    setNightLights: 'setNightLights',
    globalOff: 'globalOff',
    setWithLightColorMap: 'setWithLightColorMap',
    setMaxBrightness: 'setMaxBrightness',
    toggleSwitch: 'toggleSwitch',
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
    setWithLightColorMap,
    setMaxBrightness,
    toggleSwitch
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
    alarmCtrl.stopWakeSequence();
    await mqttApi.setColor('all', {
        color: {},
        duration: 250,
        power: 'OFF'
    })
}

async function setWithLightColorMap({ device, power }) {
    await mqttApi.setColor(device, {
        ...lightValueTimeMap[new Date().getHours()],
        duration: 250,
        power: power,
    })
}

async function toggleSwitch(device) {
    await mqttApi.setSwitchState(device, { power: 'TOGGLE' })
}

async function setMaxBrightness(device) {
    await mqttApi.setColor(device, {
        color: { brightness: 1, kelvin: DEVICE_CONFIG[device].TEMP_MAX },
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

    const tempMin = DEVICE_CONFIG[device].TEMP_MIN;
    const tempMax = DEVICE_CONFIG[device].TEMP_MAX;

    const relativeTemperature = (baseState.kelvin - tempMin) / (tempMax - tempMin)
    const color = lightUtil.logarithmicColorScale(
        Math.max(0.01, Math.min(relativeTemperature + (DIMMER_STEP * holdCounter), 1)),
        tempMin,
        tempMax
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
