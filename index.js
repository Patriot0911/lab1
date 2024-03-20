const { commandHandle } = require('./bin/index');

const testFunc = (args, opts) => {
    return commandHandle(args, opts);
};

module.exports = {
    testFunc
};
