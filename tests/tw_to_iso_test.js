/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const tw_to_iso = require('../lib/tw_to_iso');
const t = require('tap');
var expect = require('chai').expect;

t.test('tw_to_iso', t => {
    expect(tw_to_iso('20220126T233422Z')).to.equal('2022-01-26T23:34:22Z');
    t.end();
});
