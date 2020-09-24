const { expect } = require('chai');
const { fork } = require('child_process');
const superagent = require('superagent');


let apiProcess;

describe('Test basic API calls', function() {
    before(function(done) {
        apiProcess = fork('./test/mock/lifxServerMock', []);
        setTimeout(done, 5000);
    });

    it('getState should return the mocked device config', async function() {
        const expectedValue = {
            state: require('./mock/deviceState')
        };

        const res = await superagent.get('http://localhost:9999/api/state');
        const state = res.body;

        expect(state).to.deep.equal(expectedValue);
    });

    after(function() {
        apiProcess && apiProcess.kill();
    });
});