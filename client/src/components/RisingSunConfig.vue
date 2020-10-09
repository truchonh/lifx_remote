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
            <v-btn text v-on="on" style="height: auto">
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
          <v-chip v-for="day in weekDays" :key="day.key">
            {{ day.value }}
          </v-chip>
        </v-chip-group>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import {mapActions} from 'vuex'

export default {
  name: 'RisingSunConfig',
  data() {
    return {
      time: '8:00',
      pickerModal: false,
      selectedDays: [1,2,3,4,5]
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
    _updateAlarm() {
      this.pickerModal = false
      this.updateAlarm({ time: this.time, days: this.selectedDays })
    },

    ...mapActions([
      'updateAlarm'
    ]),
  }
}
</script>

<style scoped>

</style>