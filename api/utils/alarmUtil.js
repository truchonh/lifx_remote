const _ = require('lodash')

class alarmUtil {
    static validateConfig(config) {
        if (typeof config.desiredWakeTime !== 'string') {
            return 'Desired wake time missing'
        } else if (config.desiredWakeTime.split(':').length !== 2) {
            return 'Invalid desired wake time value'
        } else if (_.isEmpty(config.alarmDays) || !_.isArray(config.alarmDays)) {
            return 'Empty or missing alarm days'
        } else if (typeof config.cron !== 'string') {
            return 'Alarm cron missing or invalid'
        } else if (_.isEmpty(config.sequence) || !_.isArray(config.sequence)) {
            return 'Empty or missing wake up sequence'
        } else if (
            config.sequence.some(_item => {
                if (typeof _item.time !== 'string') {
                    return true
                } else if (typeof _item.brightness !== 'number') {
                    return true
                } else if (typeof _item.kelvin !== 'number') {
                    return true
                }
                return false
            })
        ) {
            return 'A wake up sequence value is invalid'
        }
    }

    static calculateLightValue(sequence) {
        const now = new Date()
        const nowMinutes = (now.getHours() * 60) + now.getMinutes() + (now.getSeconds() / 60)

        let sequenceStartMinutes = 0
        // if null, then now is before the first sequence item
        const sequenceStart = _.findLast(sequence, _item => {
            const timePart = _item.time.split(':').map(_part => parseInt(_part))
            sequenceStartMinutes = (timePart[0] * 60) + timePart[1]
            return sequenceStartMinutes <= nowMinutes
        })
        let sequenceEndMinutes = 0
        // if null, then now is after the last sequence item
        const sequenceEnd = _.find(sequence, _item => {
            const timePart = _item.time.split(':').map(_part => parseInt(_part))
            sequenceEndMinutes = (timePart[0] * 60) + timePart[1]
            return nowMinutes <= sequenceEndMinutes
        })

        if (!sequenceStart) {
            return {
                brightness: _.first(sequence).brightness,
                kelvin: Math.round(_.first(sequence).kelvin)
            }
        } else if (!sequenceEnd) {
            return {
                brightness: _.last(sequence).brightness,
                kelvin: Math.round(_.last(sequence).kelvin)
            }
        }

        const periodLength = sequenceEndMinutes - sequenceStartMinutes
        const periodRatio = periodLength === 0 ? 1 : (nowMinutes - sequenceStartMinutes) / periodLength
        const calculatedBrightness = ((sequenceEnd.brightness - sequenceStart.brightness) * periodRatio) + sequenceStart.brightness
        const calculatedKelvin = ((sequenceEnd.kelvin - sequenceStart.kelvin) * periodRatio) + sequenceStart.kelvin

        return {
            brightness: calculatedBrightness,
            kelvin: Math.round(calculatedKelvin)
        }
    }

    static isSequenceDone(sequence) {
        const now = new Date()
        const nowMinutes = (now.getHours() * 60) + now.getMinutes()

        const timePart = _.last(sequence).time.split(':').map(_part => parseInt(_part))
        const sequenceMinutes = (timePart[0] * 60) + timePart[1]

        return nowMinutes >= sequenceMinutes
    }

    static getEarlyWakeupConfig(originalConfig) {
        const cronSplit = originalConfig.cron.split(' ')
        const [minute, hour, day, month, weekDay] = cronSplit

        const offset = (hour, offsetBy) => (parseInt(hour) + (24 + offsetBy)) % 24

        return {
            ...originalConfig,
            cron: `${minute} ${offset(hour, -2)} ${day} ${month} ${weekDay}`,
            sequence: originalConfig.sequence.map(unit => {
                const [hour, minute] = unit.time.split(':')
                return {
                    ...unit,
                    time: `${offset(hour, -2)}:${minute}`
                }
            })
        };
    }
}

module.exports = alarmUtil
