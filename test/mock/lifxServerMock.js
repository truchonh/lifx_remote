const mock = require('mock-require');

mock('node-lifx-lan', require('./lifxMock'));

// start the server
require('../../server');