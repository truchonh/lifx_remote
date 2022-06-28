<template>
  <v-container>
    <v-row>
      <v-col>
        <h2 class="title">Actions</h2>
      </v-col>
    </v-row>
    <v-form>
      Température {{ this.temperature }}K
      <v-slider
          v-model="temperature"
          :disabled="!state"
          :min="1500"
          :max="4000"
          :step="100"
          thumb-label
          @change="updateTemperature"
          :color="temperatureColor"
      />

      <v-checkbox
          v-model="isTempLinkedToBrightness"
          label="Lier la température à luminosité"
      />

      Luminosité {{ this.brightness }}%
      <v-slider
          v-model="brightness"
          :disabled="!state"
          :min="1"
          :max="100"
          thumb-label
          @change="updateBrightness"
          :color="brightnessColor"
      />

      <v-row justify="center">
        <v-switch
            v-model="state"
            style="zoom: 150%;"
            @change="toggle"
            :loading="toggleLoading"
            :readonly="toggleLoading"
        >
          <v-icon disabled slot="prepend">{{ mdiLightbulbOff }}</v-icon>
          <v-icon disabled slot="append">{{ mdiLightbulbOn }}</v-icon>
        </v-switch>
      </v-row>

      <v-row justify="center">
        <v-col cols="12">
          <v-text-field
              label="Serveur"
              solo
              v-model="hostname"
              @change="updateHostname"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import kelvinToRgb from 'kelvin-to-rgb'
import { mdiLightbulbOn, mdiLightbulbOff } from '@mdi/js'
import lightApi from '../api/light'
import { mapActions } from 'vuex'

export default {
  name: 'QuickActions',
  data() {
    return {
      mdiLightbulbOn,
      mdiLightbulbOff,

      temperature: 3500,
      brightness: 60,
      state: true,
      toggleLoading: false,

      isTempLinkedToBrightness: true,

      hostname: '',
    }
  },

  computed: {
    temperatureColor() {
      const rgb = kelvinToRgb(this.temperature)
      return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
    },
    brightnessColor() {
      const hexValue = this.brightness / 100 * 255
      return `rgb(${hexValue},${hexValue},${hexValue})`
    }
  },

  methods: {
    async fetchConfig() {
      this.hostname = localStorage.getItem('hostname') || '192.168.0.32:9999'
      const result = await lightApi.getState()
      if (result.isSuccess) {
        const state = result.body.state
        // display stuff
        this.state = state.power
        this.brightness = state.color.brightness * 100
        this.temperature = state.color.kelvin
      }
    },

    updateBrightness() {
      if (this.isTempLinkedToBrightness) {
        this.temperature = 1500 + (this.brightness * 25)
      }
      this.setLightState({
        power: this.state,
        color: {
          brightness: this.brightness / 100,
          kelvin: this.temperature
        }
      })
    },

    updateTemperature() {
      if (this.isTempLinkedToBrightness) {
        this.brightness = (this.temperature - 1500) / 25
      }
      this.setLightState({
        power: this.state,
        color: {
          brightness: this.brightness / 100,
          kelvin: this.temperature
        }
      })
    },

    async toggle() {
      this.toggleLoading = true

      await this.setLightState({
        power: this.state,
        color: {
          brightness: this.brightness / 100,
          kelvin: this.temperature
        }
      })

      this.toggleLoading = false
    },

    updateHostname() {
      localStorage.setItem('hostname', this.hostname)
    },

    ...mapActions([
      'setLightState'
    ])
  },

  created() {
    this.fetchConfig()
  }
}
</script>

<style scoped lang="sass">

</style>