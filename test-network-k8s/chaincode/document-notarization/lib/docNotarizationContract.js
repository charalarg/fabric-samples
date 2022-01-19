/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

const {Contract, Context} = require('fabric-contract-api');
const Document = require('./document.js');
const DocumentList = require('./documentList.js');
const QueryUtils = require('./queries.js');


class DocNotarizationContext extends Context {

    constructor() {
        super();
        this.documentList = new DocumentList(this);
    }

}

class DocNotarizationContract extends Contract {
    constructor() {
        super('org.avangard.docNotarizationContract');
    }

    createContext() {
        return new DocNotarizationContext();
    }

    async instantiate(ctx) {
        console.log('Instantiate the contract');
    }


    async issue(ctx, hash, issuer, signature, timestamp) {

        let document = Document.createInstance(hash, issuer, signature, timestamp);
        document.addOwner(issuer);

        await ctx.documentList.addDocument(document);

        return document;
    }

    async queryDoc(ctx, hash, issuer) {
        let query = new QueryUtils(ctx, 'org.avangard.documents');
        return await query.queryDocument(hash, issuer);
    }

}

module.exports = DocNotarizationContract;
