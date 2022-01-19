/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

const State = require('./ledger/state.js');

class Document extends State {
    owners = [];

    constructor(obj) {
        super(Document.getClass(), [obj.hash, obj.timestamp]);
        Object.assign(this, obj);
    }

    addOwner(owner) {
        this.owners.push(owner);
    }

    getOwners() {
        return this.owners;
    }

    static createInstance(hash, issuer, signature, timestamp) {
        return new Document({hash, issuer, signature, timestamp});
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
