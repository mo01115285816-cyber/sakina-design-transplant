import {
  getLocalTimeMinutes,
  getManualOffsetMinutes,
} from '../src/utils/prayerTimes';

function assertEqual(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

const cairo = 'Africa/Cairo';

// 2026-04-24 00:00 local standard time = 2026-04-23 22:00 UTC.
assertEqual(
  getManualOffsetMinutes(new Date('2026-04-23T21:59:59Z'), cairo),
  120,
  'Egypt DST start before transition',
);
assertEqual(
  getManualOffsetMinutes(new Date('2026-04-23T22:00:00Z'), cairo),
  180,
  'Egypt DST start at transition',
);

// DST remains through the last Thursday of October and ends at 00:00
// local on Friday 2026-10-30 = 2026-10-29 21:00 UTC.
assertEqual(
  getManualOffsetMinutes(new Date('2026-10-29T20:59:59Z'), cairo),
  180,
  'Egypt DST end before transition',
);
assertEqual(
  getManualOffsetMinutes(new Date('2026-10-29T21:00:00Z'), cairo),
  120,
  'Egypt DST end at transition',
);

// The same instant must be evaluated in the selected location, not device TZ.
assertEqual(
  getLocalTimeMinutes(new Date('2026-08-15T12:30:00Z'), 30.0444, 31.2357),
  930,
  'Cairo wall-clock minutes',
);

console.log('DST_TESTS_PASSED');
