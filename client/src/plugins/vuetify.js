import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        dark: true,
        themes: {
            dark: {
                primary: '#BB86FC',
                secondary: '#BB86FC',
                accent: '#8c9eff',
                error: '#cf6679',
            },
        },
    },
    icons: {
        iconfont: 'mdiSvg',
    },
});
