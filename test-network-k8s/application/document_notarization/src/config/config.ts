import * as env from 'env-var';

// App
export const JwtSecret = 'FB8D522BD9B6C38D4C8EC2D7A04BC3FF3A54';
export const maxFileSize = 50 * 1024 * 1024;
export const logLevel = env.get('log_level').default('debug').asEnum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);
export const port = env.get('port').default('3000').example('3000').asPortNumber();
// Jobs
export const job_queue_name = 'submit';
export const submitJobBackoffType = env.get('submit_job_backoff_type').default('fixed').asEnum(['fixed', 'exponential']);
export const submitJobBackoffDelay = env.get('submit_job_backoff_delay').default('3000').example('3000').asIntPositive();
export const submitJobAttempts = env.get('submit_job_attempts').default('5').example('5').asIntPositive();
export const submitJobConcurrency = env.get('submit_job_concurrency').default('5').example('5').asIntPositive();
export const maxCompletedSubmitJobs = env.get('max_completed_submit_jobs').default('1000').example('1000').asIntPositive();
export const maxFailedSubmitJobs = env.get('max_failed_submit_jobs').default('1000').example('1000').asIntPositive();
export const submitJobQueueScheduler = env.get('submit_job_queue_scheduler').default('true').example('true').asBoolStrict();
// Fabric
export const org = env.get('org').default('Org').example('Org').asString();
export const mspid = env.get('mspid').default('OrgMSP').example('OrgMSP').asString();
export const caHostName = env.get('ca_host_name').default('org_ca').example('org_ca').asString();
export const asLocalhost = env.get('as_local_host').default('false').example('true').asBoolStrict();
export const channelName = env.get('fabric_channel').default('mychannel').example('mychannel').asString();
export const chaincodeName = env.get('fabric_contract').default('basic').example('basic').asString();
export const chaincodeId = env.get('fabric_contract_id').default('-').example('-').asString();
export const commitTimeout = env.get('hlf_commit_timout').default('300').example('300').asIntPositive();
export const endorseTimeout = env.get('hlf_endorse_timout').default('30').example('30').asIntPositive();
export const queryTimeout = env.get('hlf_query_timeout').default('3').example('3').asIntPositive();
export const fabricWalletDir = env.get('fabric_wallet_dir').default('/fabric/application/wallet').example('/path/to/wallets').asString();
export const fabricGatewayDir = env.get('fabric_gateway_dir').default('/fabric/application/gateway').example('/path/to/gateway').asString();
export const fabric_ccp_name = env.get('fabric_ccp_name').default('org_ccp.json').example('org_ccp.json').asString();
export const fabricGatewayTlsCertPath = env.get('fabric_gateway_tlsCertPath').default('/fabric/tlscacerts/org-tls-ca.pem').example('/path/to/tlscsert').asString();
export const fabricCaCertPath = env.get('fabric_ca_cert').default('/fabric/cacerts/org-ca.pem').example('/fabric/cacerts/org-ca.pem').asString();
export const fabricAppAdmin = env.get('fabric_app_admin').default('org-admin').example('org-admin').asString();
// Redis
export const redisHost = env.get('redis_host').default('localhost').example('localhost').asString();
export const redisPort = env.get('redis_port').default('6379').example('6379').asPortNumber();
export const redisUsername = env.get('redis_username').example('fabric').asString();
export const redisPassword = env.get('redis_password').asString();
// MongoDb
export const mongoDbHost = env.get('mongoDb_host').default('localhost').example('localhost').asString();
export const mongoDbPort = env.get('mongoDb_port').default('27017').example('27017').asPortNumber();
export const mongoDbUsername = env.get('mongoDb_username').example('admin').asString();
export const mongoDbPassword = env.get('mongoDb_password').default("adminpw").asString();
export const mongoDbName = env.get('mongoDbName').default("docNotarizationDb").asString();


