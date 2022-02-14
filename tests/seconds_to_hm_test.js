/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const seconds_to_hm = require('../lib/seconds_to_hm');
const t = require('tap');
var expect = require('chai').expect;

t.test('seconds_to_hm', t => {
    expect(seconds_to_hm(5466)).to.deep.equal({Hours: 1, Minutes: 32}); // inc. 6 seconds
    expect(seconds_to_hm(3600)).to.deep.equal({Hours: 1, Minutes: 0});
    expect(seconds_to_hm(13)).to.deep.equal({Hours: 0, Minutes: 1});
    expect(seconds_to_hm(0)).to.deep.equal({Hours: 0, Minutes: 0});
    expect(seconds_to_hm(12296)).to.deep.equal({Hours: 3, Minutes: 25}); // inc. 56 seconds
    t.end();
});
