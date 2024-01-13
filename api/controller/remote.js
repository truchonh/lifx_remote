const mqttApi = require('../connectors/mqttApi')
const { lightValueTimeMap } = require('../../config/config')
const lightUtil = require('../utils/lightUtil')
const simpleLogger = require('../utils/simpleLogger')

const TEMP_MIN = 2204
const TEMP_MAX = 4000
const DIMMER_STEP = 0.1

module.exports.remoteHandler = class {
    constructor(remoteName, config) {
        mqttApi.listenToRemote(remoteName, (message) => {
            handleRemoteMessage(message, config).catch(err => simpleLogger.error(err))
        }).catch(err => simpleLogger.error(`Couldn't start listening on the remote mqtt queue: `, err))
    }
}

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

const recentLightStateMap = new Map()
let holdCounter = 0
async function handleRemoteMessage(message, config) {
    const data = JSON.parse(message || '{}')

    let [button, type, action] = data?.action?.split('_') || []
    if (!button || !type || !config[button]) {
        return
    }
    if (action) {
        type = `${type}_${action}`;
    }
    console.log(button, type)

    const hasPreset = Object.values(presetFunctions).some(preset => config[button].hasOwnProperty(preset))

    if (hasPreset) {
        for (let preset of Object.values(presetFunctions).filter(preset => config[button].hasOwnProperty(preset))) {
            console.log(preset)
            const command = config[button][preset]
            await remotePresetMap[preset](type, command.device)
        }
    }

    const command = config[button][type]
    if (remoteCommandMap[command?.name]) {
        await remoteCommandMap[command.name](command.arg)
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

const remotePresetMap = {
    dimmerUp: dimmerUpHandler,
    dimmerDown: dimmerDownHandler,
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
