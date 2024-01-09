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

    /**
     * mqtt saved temperature in a value between 0-500. A high number means a low kelvin value.
     * @param colorTemp
     */
    static convertToKelvin(colorTemp) {
        if (colorTemp > 500) {
            colorTemp = 500
        } else if (colorTemp < 154) {
            colorTemp = 154
        }

        // The Sengled light support 154-500 (2000k to 6500k)
        const MIN_TEMP = 500
        const MIN_KELVIN = 2000
        const MAX_KELVIN = 6500
        const conversionRatio = MAX_KELVIN / MIN_TEMP

        return ((MIN_TEMP - colorTemp) * conversionRatio) + MIN_KELVIN
    }

    static convertToMqtt(colorKelvin) {
        if (colorKelvin > 6500) {
            colorKelvin = 6500
        } else if (colorKelvin < 2000) {
            colorKelvin = 2000
        }

        const MIN_TEMP = 500
        const MAX_TEMP = 154
        const MAX_KELVIN = 6500
        const conversionRatio = MAX_KELVIN / MIN_TEMP

        return Math.round(((MAX_KELVIN - colorKelvin) / conversionRatio) + MAX_TEMP)
    }

    static toReciprocalMegakelvin(kelvin) {
        return 1000000 / kelvin;
    }
}

module.exports = lightUtil
