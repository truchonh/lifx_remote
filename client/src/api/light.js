import superagent from 'superagent'
import ApiResult from './ApiResult'

export default {
    async getState() {
        try {
            const res = await superagent('GET', 'http://192.168.0.14:9999/api/state')
            return new ApiResult(res)
        } catch (err) {
            return this._handleError(err)
        }
    },

    async setState(config) {
        try {
            const res = await superagent('PUT', 'http://192.168.0.14:9999/api/state')
                .send(config)
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