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

    async queryDocumentHistory(hash, timestamp) {
        let self = this;
        if (arguments.length < 2) {
            throw new Error('Incorrect number of arguments. Expecting document hash and timestamp.');
        }
        let key = this.ctx.stub.createCompositeKey(this.name, [hash, timestamp]);
        let method = self.getQueryHistoryResultForKey;
        const history =  await method(this.ctx, self, key);
        return await Promise.all(history.map(async tr => {
            return tr.TxId;
        }));
    }

    async getQueryResultForQueryString(ctx, self, queryString) {
        let queryIterator = await ctx.stub.getQueryResult(queryString);
        return await self._GetAllResults(queryIterator);
    }

    async getQueryHistoryResultForKey (ctx, self, key) {
        let historyIterator = await ctx.stub.getHistoryForKey(key);
        return await self._GetAllResults(historyIterator, true);
    }

    async _GetAllResults(iterator, isHistory) {
        let allResults = [];
        let res = { done: false, value: null };

        while (true) {
            res = await iterator.next();
            let jsonRes = {};
            if (res.value && res.value.value.toString()) {
                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.txId;
                    jsonRes.Timestamp = res.value.timestamp;
                    jsonRes.Timestamp = new Date((res.value.timestamp.seconds.low * 1000));
                    let ms = res.value.timestamp.nanos / 1000000;
                    jsonRes.Timestamp.setMilliseconds(ms);
                    if (res.value.is_delete) {
                        jsonRes.IsDelete = res.value.is_delete.toString();
                    } else {
                        try {
                            jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                            switch (jsonRes.Value.currentState) {
                            case 1:
                                jsonRes.Value.currentState = 'ISSUED';
                                break;
                            case 2:
                                jsonRes.Value.currentState = 'PENDING';
                                break;
                            case 3:
                                jsonRes.Value.currentState = 'TRADING';
                                break;
                            case 4:
                                jsonRes.Value.currentState = 'REDEEMED';
                                break;
                            default:
                                jsonRes.Value.currentState = 'UNKNOWN';
                            }

                        } catch (err) {
                            console.log(err);
                            jsonRes.Value = res.value.value.toString('utf8');
                        }
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('iterator is done');
                await iterator.close();
                return allResults;
            }

        }
    }
}

module.exports = QueryUtils;
