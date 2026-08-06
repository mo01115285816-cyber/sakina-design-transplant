export type CalculationMethod = "EGYPTIAN" | "UMM_AL_QURA" | "ISNA" | "KARACHI" | "MWL";
export type AsrSchool = "STANDARD" | "HANAFI";

// Bounding box boundary checks to find the most accurate prayer calculation parameters automatically!
export function detectCalcMethodByLocation(lat: number, lon: number): CalculationMethod {
  // Egypt bounding box: Lat [22, 32], Lon [25, 36]
  if (lat >= 21.8 && lat <= 31.8 && lon >= 24.8 && lon <= 36.2) {
    return "EGYPTIAN";
  }

  // Saudi Arabia & Arabian Peninsula (Umm Al Qura): Lat [16, 32.5], Lon [34.5, 56]
  if (lat >= 16.0 && lat <= 32.5 && lon >= 34.5 && lon <= 56.0) {
    return "UMM_AL_QURA";
  }

  // Indian Subcontinent (Karachi): Lat [5.0, 37.0], Lon [60.0, 98.0]
  if (lat >= 5.0 && lat <= 37.0 && lon >= 60.0 && lon <= 98.0) {
    return "KARACHI";
  }

  // North America / General (ISNA): Lat [24.0, 83.0], Lon [-170.0, -50.0]
  if (lat >= 24.0 && lat <= 83.0 && lon >= -170.0 && lon <= -50.0) {
    return "ISNA";
  }

  // Default to Muslim World League (MWL) for other global areas (Europe, etc.)
  return "MWL";
}

export function detectAsrSchoolByLocation(lat: number, lon: number): AsrSchool {
  // Hanafi is predominantly used in India, Pakistan, Bangladesh, and Turkey/Central Asia
  // South Asia bounding: Lat [5.0, 37.0], Lon [60.0, 98.0]
  if (lat >= 5.0 && lat <= 37.0 && lon >= 60.0 && lon <= 98.0) {
    return "HANAFI";
  }

  // Central Asia & Turkey bounding: Lat [35.0, 55.0], Lon [25.0, 85.0]
  if (lat >= 35.0 && lat <= 55.0 && lon >= 25.0 && lon <= 85.0) {
    return "HANAFI";
  }

  // Default to Standard ( الجمهور - Shafi'i, Maliki, Hanbali )
  return "STANDARD";
}
