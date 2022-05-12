/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

const docNotarization = require('./lib/docNotarizationContract');

module.exports.DocNotarization = docNotarization;
module.exports.contracts = [docNotarization];
