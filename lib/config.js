/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const Conf = require('conf');

// Export is a function returning a new Configstore
module.exports = (opts) => new Conf(opts);
