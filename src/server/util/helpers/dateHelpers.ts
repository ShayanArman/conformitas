export function getTimeAgoDate({minutesAgo, hoursAgo}: {minutesAgo?: number, hoursAgo?: number}) {
    // X minutes ago
    const minutes = minutesAgo ? minutesAgo : (hoursAgo ? hoursAgo * 60 : 0);
    if (minutes === 0) {
        return new Date();
    }
    
    const CREATED_EXPIRY = minutes * 60 * 1000;
    const expireDate = new Date();
    expireDate.setMilliseconds(-1 * CREATED_EXPIRY);
    return expireDate;
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function getTimeYearsAgo(years: number): Date {
  const today = new Date();
  const yearsAgo = new Date(today.setFullYear(today.getFullYear() - years));
  return yearsAgo;
}

// time is in milliseconds; so 10 seconds is 10000
export function milliSinceDate(date: Date) {
  const timeSince = new Date().getTime() - date.getTime();
  return timeSince;
}

export function isExpired({date, milsActive}: {date: Date, milsActive: number}) {
  const millisPassed = milliSinceDate(date);
  return millisPassed > milsActive;
}

export function hoursToMils({hours}: {hours: number}) {
  return hours * 60 * 60 * 1000;
}

export function addMilsToDate({mils}: {mils: number}): Date {
  return (new Date(new Date().getTime() + mils));
}

export const TWENTY_SECONDS_MILS = 20000;
export const THIRTY_SECONDS_MILS = 30000;
export const FORTY_SECONDS_MILS = 40000;
export const SIXTY_SECONDS_MILS = 60000;
export const EIGHTY_SECONDS_MILS = 80000;
export const THREE_MIN_MILS = 180000;
export const FIVE_MIN_MILS = 300000;
export const EIGHT_MIN_MILS = 480000;
export const FIFTEEN_MIN_MILS = 900000;
export const THREE_HOURS_MILS = 60*1000*60*3;
export const ONE_DAY_MILS = 60*60*1000*24;

export const minToMils = (minutes: number) => { return minutes * 60 * 1000; }
