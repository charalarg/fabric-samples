// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  API_BASE_URL: "http://localhost",
  // API_BASE_URL: "https://4c26-46-103-135-18.eu.ngrok.io",
  API_LOGIN: "/api/users/login",
  API_CREATE_DOCUMENT: "/api/documents",
  API_GET_JOB: "/api/jobs",
  API_VALIDATE_DOCUMENT: "/api/documents/validate",
  API_REGISTER_CLIENT: "/api/users/registerClient",
  API_GET_DOCUMENTS: "/api/documents",
  API_GET_USERS: "/api/users",
  API_GET_TRANSACTIONS: "/api/transactions",
  API_REVOKE_CERT: "/api/documents/revoke",
  
  // APP_URL: "https://4c26-46-103-135-18.eu.ngrok.io",
  APP_URL: "http://localhost",

  // LOCALSTORAGE VARIABLES
  ACCESS_TOKEN: "access_token",
  USER: "user",
  ROLE: "role"

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
