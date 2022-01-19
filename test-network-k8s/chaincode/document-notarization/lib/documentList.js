/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

const StateList = require('./ledger/statelist.js');

const Documents = require('./document.js');

class DocumentList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.avangard.documents');
        this.use(Documents);
    }

    async addDocument(Document) {
        return this.addState(Document);
    }

    async getDocument(DocumentKey) {
        return this.getState(DocumentKey);
    }

    async updateDocument(Document) {
        return this.updateState(Document);
    }
}


module.exports = DocumentList;
