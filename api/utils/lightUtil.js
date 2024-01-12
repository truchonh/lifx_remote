class lightUtil {
    static kelvinToRgb(kelvin) {
        const temperature = kelvin / 100

        let red = temperature <= 66
            ? 255
            : 329.698727446 * Math.pow(temperature - 60, -0.1332047592)
        let green = temperature <= 66
            ? 99.4708025861 * Math.log(temperature) - 161.1195681661
            : 288.1221695283 * Math.pow(temperature - 60, -0.0755148492)
        let blue = temperature >= 66
            ? 255
            : (temperature <= 19
                ? 0
                : 138.5177312231 * Math.log(temperature - 10) - 305.0447927307)

        return {
            r: this.truncateColorToHex(red),
            g: this.truncateColorToHex(green) * 1.22,
            b: this.truncateColorToHex(blue)
        }
    }

    static truncateColorToHex(color) {
        if (color < 0) {
            return 0
        } else if (color > 255) {
            return 255
        } else {
            return color
        }
    }

    static toReciprocalMegakelvin(kelvin) {
        return 1000000 / kelvin;
    }

    static logarithmicColorScale(value, kelvinMin, kelvinMax) {
        const N = 2
        return {
            brightness: Math.log((Math.max(0, value) * N) + 1) / Math.log(N + 1),
            kelvin: (value * (kelvinMax - kelvinMin)) + kelvinMin
        }
    }

    static exponentialColorScale(value, kelvinMin, kelvinMax) {
        const N = 20
        const expValue = (Math.pow(N + 1, Math.max(0, value)) - 1) / N
        return {
            brightness: value,
            kelvin: (expValue * (kelvinMax - kelvinMin)) + kelvinMin
        }
    }
}

module.exports = lightUtil
