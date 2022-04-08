/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

class QueryUtils {

    constructor(ctx, listName) {
        this.ctx = ctx;
        this.name = listName;
    }

    async queryDocumentsByClient(client) {
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting client id.');
        }
        let queryString = {};
        queryString.selector = {};
        queryString.selector.client = client;

        let method = self.getQueryResultForQueryString;
        return await method(this.ctx, self, JSON.stringify(queryString));
    }

    async queryDocumentsByHash(hash) {
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting document hash.');
        }
        let queryString = {};
        queryString.selector = {};
        queryString.selector.hash = hash;

        let method = self.getQueryResultForQueryString;
        return await method(this.ctx, self, JSON.stringify(queryString));
    }

    async queryDocumentsByIssuer(issuer) {
        let self = this;
        if (arguments.length < 1) {
            throw new Error('Incorrect number of arguments. Expecting issuer id.');
        }
        let queryString = {};
        queryString.selector = {};
        queryString.selector.issuer = issuer;

        let method = self.getQueryResultForQueryString;
        return await method(this.ctx, self, JSON.stringify(queryString));
    }

    async getQueryResultForQueryString(ctx, self, queryString) {
        const resultsIterator = await ctx.stub.getQueryResult(queryString);
        return await self._GetAllResults(resultsIterator);
    }

    async _GetAllResults(iterator) {
        let allResults = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                {
                    try {
                        jsonRes = JSON.parse(res.value.value.toString());
                    } catch (err) {
                        jsonRes = res.value.value.toString();
                    }
                }
                allResults.push(jsonRes);
            }
            res = await iterator.next();
        }
        iterator.close();
        return allResults;
    }
}

module.exports = QueryUtils;
