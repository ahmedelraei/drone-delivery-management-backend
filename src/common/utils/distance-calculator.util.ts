/**
 * Distance calculation utility using Haversine formula
 * Calculates great-circle distance between two geographic coordinates
 */
export class DistanceCalculator {
  // Earth's radius in kilometers
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   *
   * Formula:
   * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
   * c = 2 ⋅ atan2(√a, √(1−a))
   * d = R ⋅ c
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Check if a point is within a certain radius of another point
   * Useful for verifying drone is at pickup/delivery location
   */
  static isWithinRadius(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusMeters: number,
  ): boolean {
    const distanceKm = this.calculateDistance(lat1, lon1, lat2, lon2);
    const distanceMeters = distanceKm * 1000;
    return distanceMeters <= radiusMeters;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate estimated delivery time based on distance
   * Assumes average drone speed of 50 km/h with 15% safety buffer
   */
  static calculateETA(distanceKm: number, averageSpeedKmh: number = 50): Date {
    const hoursToDeliver = distanceKm / averageSpeedKmh;
    const hoursWithBuffer = hoursToDeliver * 1.15; // Add 15% buffer
    const minutesToDeliver = Math.ceil(hoursWithBuffer * 60);

    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + minutesToDeliver);

    return eta;
  }
}
