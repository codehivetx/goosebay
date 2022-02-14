/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

function seconds_to_hm(seconds) {
    const rawMinutes = Math.ceil(seconds / 60);
    const Minutes = rawMinutes % 60;
    const Hours = (rawMinutes-Minutes) / 60;
    return {Hours, Minutes};
}

module.exports = seconds_to_hm;
