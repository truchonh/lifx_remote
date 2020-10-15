<template>
  <v-container>
    <v-row>
      <v-col>
        <h2 class="title">Réveille matin</h2>
      </v-col>
    </v-row>
    <v-form>
      <v-row justify="center">
        <v-dialog v-model="pickerModal" max-width="300">
          <template v-slot:activator="{ on }">
            <v-btn text v-on="on" style="height: auto" :loading="isLoading">
              <h1 class="display-3">{{ time }}</h1>
            </v-btn>
          </template>
          <v-card>
            <v-time-picker
                v-model="time"
                v-if="pickerModal"
                format="24hr"
                full-width
                @change="_updateAlarm()"
            />
          </v-card>
        </v-dialog>
        <v-chip-group multiple active-class="primary--text" v-model="selectedDays" @change="_updateAlarm()">
          <v-chip v-for="day in weekDays" :key="day.key" :disabled="isLoading">
            {{ day.value }}
          </v-chip>
        </v-chip-group>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import {mapActions} from 'vuex'
import lightApi from '@/api/light'

export default {
  name: 'RisingSunConfig',
  data() {
    return {
      isLoading: true,
      time: '8:00',
      pickerModal: false,
      selectedDays: []
    }
  },

  computed: {
    weekDays() {
      return [
        { key: 0, value: 'D' },
        { key: 1, value: 'L' },
        { key: 2, value: 'M' },
        { key: 3, value: 'M' },
        { key: 4, value: 'J' },
        { key: 5, value: 'V' },
        { key: 6, value: 'S' }
      ]
    }
  },

  methods: {
    async fetchConfig() {
      const result = await lightApi.getAlarm()
      if (result.isSuccess) {
        const alarmConfig = result.body

        this.time = alarmConfig.desiredWakeTime || '8:00'
        this.selectedDays = alarmConfig.alarmDays || [1,2,3,4,5]
      }

      this.isLoading = false
    },

    _updateAlarm() {
      this.pickerModal = false
      this.updateAlarm({ time: this.time, days: this.selectedDays })
    },

    ...mapActions([
      'updateAlarm'
    ]),
  },

  created() {
    this.fetchConfig()
  }
}
</script>

<style scoped>

</style>