module.exports = {
    "css": {
        "loaderOptions": {
            "sass": {
                "sassOptions": {
                    "includePaths": [
                        "./node_modules"
                    ]
                }
            }
        }
    },

    "transpileDependencies": [
        "vuetify"
    ],

    publicPath: '',

    pluginOptions: {
        cordovaPath: 'src-cordova'
    }
}
