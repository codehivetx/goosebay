/**
 * Copyright (c) 2022 Code Hive Tx, LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Convert TW to ISO date
 * @param {String} str
 * @returns str iso date
 */
function tw_to_iso(str) {
    return `${str.substring(0,4)}-${str.substring(5,2)}-${str.substring(7,2)}${str.substring(9,3)}:${str.substring(12,2)}:${str.substring(14,2)}Z`;
}

module.exports = tw_to_iso;
