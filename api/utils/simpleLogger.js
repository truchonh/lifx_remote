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
    static log(message, ...otherMessages) {
        let timestamp = new Date().toLocaleString('fr-CA', dateFormat);
        console.log(timestamp + ' ' + message, ...(otherMessages || []));
    }

    static error(message, ...otherMessages) {
        let timestamp = new Date().toLocaleString('fr-CA', dateFormat);
        console.error(timestamp + ' ' + message, ...(otherMessages || []));
    }
}
module.exports = SimpleLogger;
