/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

const State = require('./ledger/state.js');

class Document extends State {

    constructor(obj) {
        super(Document.getClass(), [obj.hash, obj.timestamp]);
        Object.assign(this, obj);
    }

    static createInstance(hash, issuer, mspId, certificate, signature, client, timestamp, title, expires) {
        return new Document({hash, issuer, mspId, certificate, signature, client, timestamp, title, expires});
    }

    static getClass() {
        return 'org.avangard.document';
    }

    static fromBuffer(buffer) {
        return Document.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    static deserialize(data) {
        return State.deserializeClass(data, Document);
    }

}

module.exports = Document;
