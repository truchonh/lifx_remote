const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'LIFX light controller',
    description: 'Locally hosted LIFX service API',
    script: path.join(__dirname, 'server.js'),
});

svc.on('uninstall', function() {
    svc.install();
});
svc.on('alreadyuninstalled', function() {
    svc.install();
});
svc.on('install',function(){
    svc.start();
});

svc.uninstall();