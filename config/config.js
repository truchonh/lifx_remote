module.exports = {
    defaultDevice: 'group_1',

    lightValueTimeMap: {
        0: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
        1: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
        2: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
        3: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
        4: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
        5: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
        6: { power: true, color: { brightness: 0.4, kelvin: 2500 } },
        7: { power: true, color: { brightness: 0.76, kelvin: 3400 } },
        8: { power: true, color: { brightness: 0.76, kelvin: 3400 } },
        9: { power: true, color: { brightness: 0.76, kelvin: 3400 } },
        10: { power: true, color: { brightness: 1, kelvin: 4000 } },
        11: { power: true, color: { brightness: 1, kelvin: 4000 } },
        12: { power: true, color: { brightness: 1, kelvin: 4000 } },
        13: { power: true, color: { brightness: 1, kelvin: 4000 } },
        14: { power: true, color: { brightness: 1, kelvin: 4000 } },
        15: { power: true, color: { brightness: 1, kelvin: 4000 } },
        16: { power: true, color: { brightness: 1, kelvin: 4000 } },
        17: { power: true, color: { brightness: 1, kelvin: 4000 } },
        18: { power: true, color: { brightness: 0.68, kelvin: 3200 } },
        19: { power: true, color: { brightness: 0.68, kelvin: 3200 } },
        20: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
        21: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
        22: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
        23: { power: true, color: { brightness: 0.52, kelvin: 2800 } },
    },

    defaultAlarm: {
        ALARM_CONFIG: {
            cron: '15 8 * * *',
            sequence: [
                {
                    time: '8:15',
                    brightness: 0.01,
                    kelvin: 1500
                },
                {
                    time: '8:18',
                    brightness: 0.10,
                    kelvin: 2500
                },
                {
                    time: '8:26',
                    brightness: 0.3,
                    kelvin: 3100
                },
                {
                    time: '8:30',
                    brightness: 0.65,
                    kelvin: 3400
                }
            ]
        }
    }

}
