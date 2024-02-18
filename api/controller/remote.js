const mqttApi = require('../connectors/mqttApi')
const simpleLogger = require('../utils/simpleLogger')
const { presetFunctions, remotePresetMap, remoteCommandMap } = require('../utils/remoteConfig')

module.exports.initRemoteController = async function (remoteName, config) {
    try {
        await mqttApi.listenToRemote(remoteName, (message) => {
            handleRemoteMessage(message, config).catch(err => simpleLogger.error(err))
        })
    } catch (err) {
        simpleLogger.error(`Couldn't start listening on the remote mqtt queue: `, err)
    }
}

async function handleRemoteMessage(message, config) {
    const data = JSON.parse(message || '{}')

    let [button, type, action] = data?.action?.split('_') || []
    if (!button || !type || !config[button]) {
        return
    }
    if (action) {
        type = `${type}_${action}`;
    }

    const hasPreset = Object.values(presetFunctions).some(preset => config[button].hasOwnProperty(preset))
    if (hasPreset) {
        for (let preset of Object.values(presetFunctions).filter(preset => config[button].hasOwnProperty(preset))) {
            const command = config[button][preset]
            await remotePresetMap[preset](type, command.device)
        }
    }

    const command = config[button][type]
    if (remoteCommandMap[command?.name]) {
        await remoteCommandMap[command.name](command.arg)
    }
}
