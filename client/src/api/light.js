import superagent from 'superagent'
import ApiResult from './ApiResult'

export default {
    get _hostname() {
        const hostname = localStorage.getItem('hostname') || '192.168.0.32:9999'
        return `http://${hostname}`
    },

    async getState() {
        try {
            const res = await superagent('GET', `${this._hostname}/api/state`)
            return new ApiResult(res)
        } catch (err) {
            return this._handleError(err)
        }
    },

    async setState(config) {
        try {
            const res = await superagent('PUT', `${this._hostname}/api/state`).send(config)
            return new ApiResult(res)
        } catch (err) {
            return this._handleError(err)
        }
    },

    async getAlarm() {
        try {
            const res = await superagent('GET', `${this._hostname}/api/alarm`)
            return new ApiResult(res)
        } catch (err) {
            return this._handleError(err)
        }
    },

    async updateAlarm(time, days) {
        try {
            let hour = parseInt(time.split(':').shift())
            let minutes = parseInt(time.split(':').pop())
            const date = new Date()
            date.setHours(hour)
            date.setMinutes(minutes - 30)

            const config = {
                desiredWakeTime: time,
                alarmDays: days,
                cron: `${date.getMinutes()} ${date.getHours()} * * ${days.join(',')}`,
                sequence: [
                    {
                        time: `${date.getHours()}:${date.getMinutes()}`,
                        brightness: 0.01,
                        kelvin: 100
                    }
                ]
            }

            date.setMinutes(date.getMinutes() + 3)
            config.sequence.push({
                time: `${date.getHours()}:${date.getMinutes()}`,
                brightness: 0.05,
                kelvin: 1500
            });
            date.setMinutes(date.getMinutes() + 12)
            config.sequence.push({
                time: `${date.getHours()}:${date.getMinutes()}`,
                brightness: 0.2,
                kelvin: 1990
            });
            date.setMinutes(date.getMinutes() + 1)
            config.sequence.push({
                time: `${date.getHours()}:${date.getMinutes()}`,
                brightness: 0.1,
                kelvin: 2000
            });
            date.setMinutes(date.getMinutes() + 24)
            config.sequence.push({
                time: `${date.getHours()}:${date.getMinutes()}`,
                brightness: 0.3,
                kelvin: 3400
            });
            date.setMinutes(date.getMinutes() + 5)
            config.sequence.push({
                time: `${date.getHours()}:${date.getMinutes()}`,
                brightness: 0.3,
                kelvin: 5500
            });

            const res = await superagent('PUT', `${this._hostname}/api/alarm`).send(config)
            return new ApiResult(res)
        } catch (err) {
            return this._handleError(err)
        }
    },

    /**
     * @param err
     * @returns {ApiResult}
     * @private
     */
    _handleError(err) {
        if (err.status) {
            // handle server-side error
            return new ApiResult({
                status: err.status,
                error: err,
            })
        } else {
            // handle client-side error
            // could be: timeout, aborded request, malformed config, unreachable or generic exception
            return new ApiResult({
                error: err,
            })
        }
    },
}