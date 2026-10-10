export const DAMANHOUR = {
  latitude: 31.04,
  longitude: 30.47,
  timeZone: 'Africa/Cairo',
  city: 'دمنهور، مصر',
} as const;

export type PrayerName =
  | 'الفجر'
  | 'الشروق'
  | 'الظهر'
  | 'العصر'
  | 'المغرب'
  | 'العشاء';

export type PrayerTimes = Record<PrayerName, string>;

const degrees = (radians: number) => (radians * 180) / Math.PI;
const radians = (degreesValue: number) => (degreesValue * Math.PI) / 180;

function cairoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: DAMANHOUR.timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const value = (name: string) =>
    Number(parts.find((part) => part.type === name)?.value ?? 0);

  return { year: value('year'), month: value('month'), day: value('day') };
}

function cairoUtcOffsetHours(year: number, month: number, day: number) {
  const sample = new Date(Date.UTC(year, month - 1, day, 12));
  const zoneName = new Intl.DateTimeFormat('en', {
    timeZone: DAMANHOUR.timeZone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(sample)
    .find((part) => part.type === 'timeZoneName')?.value;

  const match = zoneName?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 2;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) + Number(match[3] ?? 0) / 60);
}

function formatLocalHours(hours: number) {
  const totalMinutes = ((Math.round(hours * 60) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function hourAngleForSunAltitude(
  latitude: number,
  declination: number,
  altitude: number,
) {
  const lat = radians(latitude);
  const alt = radians(altitude);
  const cosineHourAngle =
    (Math.sin(alt) - Math.sin(lat) * Math.sin(declination)) /
    (Math.cos(lat) * Math.cos(declination));
  if (cosineHourAngle < -1 || cosineHourAngle > 1) return null;
  return degrees(Math.acos(cosineHourAngle)) / 15;
}

/**
 * Calculates approximate Damanhour times using the Egyptian General Authority
 * convention (Fajr 19.5°, Isha 17.5°). Confirm local adjustments with a
 * trusted Egyptian authority before using for religious observance.
 */
export function calculateDamanhourPrayerTimes(date = new Date()): PrayerTimes {
  const { year, month, day } = cairoDateParts(date);
  const dayOfYear = Math.floor(
    (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000,
  );
  const gamma = (2 * Math.PI * (dayOfYear - 1)) / 365;
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const noon =
    12 +
    (cairoUtcOffsetHours(year, month, day) * 15 - DAMANHOUR.longitude) / 15 -
    equationOfTime / 60;
  const latitude = radians(DAMANHOUR.latitude);
  const asrShadowFactor = 1;
  const asrAltitude = degrees(
    Math.atan(
      1 /
        (asrShadowFactor +
          Math.tan(Math.abs(latitude - declination))),
    ),
  );
  const asrAngle = hourAngleForSunAltitude(
    DAMANHOUR.latitude,
    declination,
    asrAltitude,
  );
  const timeAtAngle = (altitude: number) => {
    const angle = hourAngleForSunAltitude(
      DAMANHOUR.latitude,
      declination,
      altitude,
    );
    return angle === null ? null : angle;
  };

  return {
    الفجر: formatLocalHours(noon - (timeAtAngle(-19.5) ?? 0)),
    الشروق: formatLocalHours(noon - (timeAtAngle(-0.833) ?? 0)),
    الظهر: formatLocalHours(noon),
    العصر: formatLocalHours(noon + (asrAngle ?? 0)),
    المغرب: formatLocalHours(noon + (timeAtAngle(-0.833) ?? 0)),
    العشاء: formatLocalHours(noon + (timeAtAngle(-17.5) ?? 0)),
  };
}

export function calculateQiblaBearing(
  latitude = DAMANHOUR.latitude,
  longitude = DAMANHOUR.longitude,
) {
  const kaabaLatitude = radians(21.4225);
  const longitudeDifference = radians(39.8262 - longitude);
  const lat = radians(latitude);
  const bearing =
    Math.atan2(
      Math.sin(longitudeDifference),
      Math.cos(lat) * Math.tan(kaabaLatitude) -
        Math.sin(lat) * Math.cos(longitudeDifference),
    ) * 180 /
    Math.PI;
  return (bearing + 360) % 360;
}

export function getLocalDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: DAMANHOUR.timeZone,
  }).format(date);
}

export function formatDegrees(value: number) {
  return `${Math.round(value)}°`;
}
