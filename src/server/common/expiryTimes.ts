// How many minutes since we knew that this email was in INBOX
export const INBOX_MESSAGE_FRESH_MIN = 360;

// How many minutes since we knew that this email was in FOLDER
export const FOLDER_MESSAGE_FRESH_MIN = 60*24;

// The folder in our DB, does it also exist in Gmail?
// And when did we last know this
export const FOLDER_FRESH_HOURS = 5;

// ONE WEEK
export const COLLECTION_FRESH_MIN = 10080;
// This one is extremely important. How long since we finished intake,
// do we check for new emails?
// MINUTES * SECONDS * MILS. = 1 day = 60 minutes * 24 hours * 60 seconds * 1000 milliseconds.
// 1000 milliseconds  * 60   * 60 * 24 / day = 
export const CHECK_FOR_NEW_EMAILS_MILS = 60 * 24 * 60 * 1000;

// 3 hours: Thread processing time. We've JUST processed this thread. No need to Intake again.
export const THREAD_FRESH_MILLISECONDS = 1000*60*60*3;
export const SUBSCRIPTION_YEARS_ACTIVE = 1;

// 2 hours mins
export const NEW_LOGIN_INTERVAL_MINS = 90;
// 2 hours mils
export const SESSION_EXPIRED_MILS = 1000*60*NEW_LOGIN_INTERVAL_MINS;
// every 30 seconds.
export const SESSION_PROVIDER_REFETCH_INTERVAL_SECS = 30;

// 3 hours.
export const DELETE_JOB_ALLOWED_MILS = 60*1000*60*3;