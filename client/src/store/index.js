import Vue from 'vue'
import Vuex from 'vuex'
import lightApi from '../api/light'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        lightPower: false,
        colorBrightness: 0.6,
        colorTemperature: 3500,
    },

    mutations: {
        setConfig(state, lightConfig) {

        }
    },

    actions: {
        async setLightState({ commit }, config) {
            const result = await lightApi.setState(config)
            if (!result.isSuccess) {
                // pop the snackbar
            }
        },

        async updateAlarm({ commit }, { time, days }) {
            const result = await lightApi.updateAlarm(time, days)
            if (!result.isSuccess) {
                // pop the snackbar
                console.log(result);
            }
        }
    }
})
