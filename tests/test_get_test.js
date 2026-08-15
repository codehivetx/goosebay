/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const t = require('tap');
//var expect = require('chai').expect;
const Cli = require('../lib/cli');

t.test('./bin/goosebay -K test --get', async (/*t*/) => {
    const argv = { _: [], K: 'test', configName: 'test', get: true, P: true };
    const cli = new Cli();
    await cli.run(argv);
});
