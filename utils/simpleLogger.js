const dateFormat = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
};

class SimpleLogger {
    static log(message) {
        let timestamp = new Date().toLocaleString('fr-CA', dateFormat);
        console.log(timestamp + ' ' + message);
    }

    static error(message) {
        let timestamp = new Date().toLocaleString('fr-CA', dateFormat);
        console.error(timestamp + ' ' + message);
    }
}
module.exports = SimpleLogger;
