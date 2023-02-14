const superagent = require('superagent')
const config = require('../../config/config')

class WeatherApi {
    /**
     * weather.id Weather condition id
     * weather.main Group of weather parameters (Rain, Snow, Extreme etc.)
     * weather.description Weather condition within the group. You can get the output in your language. Learn more
     * weather.icon Weather icon id
     * @returns {Promise<{ id: number, main: string, description: string, icon: string }>}
     */
    static async getCurrentWeather() {
        const sherbrooke = {
            lat: '45.388489',
            lon: '-71.921386'
        }
        const res = await superagent
            .get(`https://api.openweathermap.org/data/2.5/weather`)
            .query({
                units: 'metric',
                appid: config.weatherApiKey,
                ...sherbrooke
            })
        return res.body?.weather[0] || {}
    }
}
module.exports = WeatherApi
