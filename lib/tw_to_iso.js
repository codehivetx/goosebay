/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const pat = /(?<yr>\d\d\d\d)(?<mo>\d\d)(?<da>\d\d)T(?<hr>\d\d)(?<mi>\d\d)(?<se>\d\d)Z/;
/**
 * Convert TW to ISO date
 * @param {String} str
 * @returns str iso date
 */
function tw_to_iso(str) {
    const {yr, mo, da, hr, mi, se} = pat.exec(str).groups;
    return `${yr}-${mo}-${da}T${hr}:${mi}:${se}Z`;
}

module.exports = tw_to_iso;
