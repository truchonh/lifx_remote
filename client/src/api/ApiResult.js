export default class Result {
    get isSuccess() {
        return 200 <= this.status && this.status < 400
    }

    get hasValidationError() {
        return this.status === 400
    }

    get isNetworkError() {
        return !this.status && this.error && ['Request has been terminated'].some(_message => {
            return this.error.message.includes(_message)
        })
    }

    /**
     * @param {object} config
     * @param {number} [config.status]
     * @param {object} config.body
     * @param {Error} [config.error]
     */
    constructor(config) {
        const { status, body, error } = config

        this.status = status
        this.body = body
        this.error = error
    }
}
