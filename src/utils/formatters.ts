/**
 * Utility functions for formatting aerospace and physics telemetry.
 */

export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || !isFinite(km)) {
    return 'N/A';
  }
  const absKm = Math.abs(km);
  const sign = km < 0 ? '-' : '';

  if (absKm < 1) {
    return `${sign}${(absKm * 1000).toFixed(0)} m`;
  }
  if (absKm < 10) {
    return `${sign}${absKm.toFixed(2)} km`;
  }
  if (absKm < 1000) {
    return `${sign}${absKm.toFixed(1)} km`;
  }
  if (absKm < 1000000) {
    return `${sign}${absKm.toLocaleString('en-US', { maximumFractionDigits: 0 })} km`;
  }
  return `${sign}${(absKm / 1000000).toFixed(3)}M km`;
}

export function formatSpeed(kmPerSec: number | null | undefined): string {
  if (kmPerSec === null || kmPerSec === undefined || !isFinite(kmPerSec)) {
    return '0.0 m/s';
  }
  const mPerSec = kmPerSec * 1000;
  const absM = Math.abs(mPerSec);
  const sign = mPerSec < 0 ? '-' : '';

  if (absM < 10000) {
    return `${sign}${absM.toFixed(1)} m/s`;
  }
  return `${sign}${kmPerSec.toFixed(3)} km/s`;
}

export function formatAcceleration(kmPerSecSq: number): string {
  const mPerSecSq = kmPerSecSq * 1000;
  const gForce = mPerSecSq / 9.81;
  return `${mPerSecSq.toFixed(2)} m/s² (${gForce.toFixed(2)} G)`;
}

export function formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !isFinite(seconds) || seconds < 0) {
    return 'N/A';
  }
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hrs > 24) {
    const days = (seconds / 86400).toFixed(1);
    return `${days} days`;
  }
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

export function formatMass(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} t (${kg.toFixed(0)} kg)`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function formatAngleDegrees(rad: number): string {
  let deg = (rad * 180) / Math.PI;
  while (deg < 0) deg += 360;
  while (deg >= 360) deg -= 360;
  return `${deg.toFixed(1)}°`;
}
