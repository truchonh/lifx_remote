<template>
  <v-app>
    <div>
      <v-app-bar dense>
        <v-toolbar-title>Lumière intelligente</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="refresh">
          <v-icon>{{ mdiRefresh }}</v-icon>
        </v-btn>
      </v-app-bar>
    </div>

    <v-content>
      <RisingSunConfig ref="alarmConfig"/>
      <v-divider />
      <QuickActions ref="quickActions"/>
    </v-content>
  </v-app>
</template>

<script>
import RisingSunConfig from './components/RisingSunConfig'
import QuickActions from './components/QuickActions'
import { mdiRefresh } from '@mdi/js'
import { mapState } from 'vuex'

export default {
  name: 'App',
  components: {
    RisingSunConfig,
    QuickActions
  },

  data() {
    return {
      mdiRefresh,
    }
  },

  methods: {
    refresh() {
      this.$refs.alarmConfig.fetchConfig()
      this.$refs.quickActions.fetchConfig()
    }
  },

  created() {
    document.addEventListener('resume', () => {
      this.refresh()
    })
  }
};
</script>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
