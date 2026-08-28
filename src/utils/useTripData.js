/**
 * useTripData — Data Adapter Module (Deep)
 *
 * Interface: thin. Implementation: absorbs all Firestore real-time logic.
 *
 * Exports:
 *   useCurrentTrip(route)           — live trip for a single route
 *   useTripAttendances(tripId)      — live attendance list for a trip
 *   useAllActiveTrips(routes)       — live trips for multiple routes
 *   useDriverAttendanceMap(tripId)  — live attendance map keyed by studentId
 */

import { useEffect, useState } from 'react';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ensureDailyTripExists } from './tripManager';

/**
 * Listens to the current daily trip for a single route.
 * Returns { trip, tripId, loading }
 */
export function useCurrentTrip(route) {
  const [trip, setTrip] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!route) {
      setLoading(false);
      return;
    }

    let unsub = () => {};

    ensureDailyTripExists(route).then((id) => {
      if (!id) {
        setLoading(false);
        return;
      }

      setTripId(id);

      unsub = onSnapshot(doc(db, 'trips', id), (snap) => {
        if (snap.exists()) {
          setTrip({ id: snap.id, ...snap.data() });
          setError(null);
        } else {
          setTrip(null);
        }
        setLoading(false);
      }, (err) => {
        console.error("useCurrentTrip snapshot error:", err);
        setError(err);
        setLoading(false);
      });
    }).catch(err => {
      console.error("useCurrentTrip init error:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsub();
  }, [route]);

  return { trip, tripId, loading, error };
}

/**
 * Listens to all attendance docs for a given tripId.
 * Returns { attendances, loading }
 * Each attendance: { id, studentId, studentName, faculty, status, lat, lng, ... }
 */
export function useTripAttendances(tripId) {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) {
      setAttendances([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'attendance'), where('tripId', '==', tripId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => a.studentName); // exclude anonymous/partial docs
      setAttendances(list);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("useTripAttendances snapshot error:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsub();
  }, [tripId]);

  return { attendances, loading, error };
}

/**
 * Listens to attendance as a map keyed by studentId — optimised for driver views.
 * Returns { attendanceMap, loading }
 */
export function useDriverAttendanceMap(tripId) {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) {
      setAttendanceMap({});
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'attendance'), where('tripId', '==', tripId));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.forEach((d) => {
        const data = d.data();
        map[data.studentId] = data;
      });
      setAttendanceMap(map);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("useDriverAttendanceMap snapshot error:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsub();
  }, [tripId]);

  return { attendanceMap, loading, error };
}

/**
 * Listens to trips for multiple routes simultaneously — used by the multi-route map.
 * Returns { allTrips, loading }  where allTrips is { [tripId]: trip }
 */
export function useAllActiveTrips(routes) {
  const [allTrips, setAllTrips] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    const unsubs = [];

    const setup = async () => {
      for (const route of routes) {
        const id = await ensureDailyTripExists(route);
        if (!id) continue;

        const unsub = onSnapshot(doc(db, 'trips', id), (snap) => {
          if (snap.exists()) {
            setAllTrips((prev) => ({ ...prev, [id]: { id: snap.id, ...snap.data() } }));
          }
        });
        unsubs.push(unsub);
      }
      setLoading(false);
    };

    setup();

    return () => unsubs.forEach((u) => u());
  }, [JSON.stringify(routes)]); // stable dep when routes array is recreated each render

  return { allTrips, loading };
}

/**
 * Listens to attendances for multiple tripIds simultaneously.
 * Returns { allAttendances, loading }  as a flat array.
 */
export function useAllTripAttendances(tripIds) {
  const [allAttendances, setAllAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripIds || tripIds.length === 0) {
      setAllAttendances([]);
      setLoading(false);
      return;
    }

    const unsubs = [];
    const cache = new Map(); // tripId -> attendance[]

    tripIds.forEach((tripId) => {
      const q = query(collection(db, 'attendance'), where('tripId', '==', tripId));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        cache.set(tripId, list);

        const merged = Array.from(cache.values()).flat();
        setAllAttendances(merged);
        setLoading(false);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u());
  }, [JSON.stringify(tripIds)]);

  return { allAttendances, loading };
}

/**
 * Fetches a real driving ETA (in minutes) from OSRM between two coordinates.
 * Caches the result for 30 seconds to avoid spamming the public OSRM API.
 * Falls back to a straight-line Haversine estimate if the request fails.
 *
 * Returns { etaMinutes, loading, error }
 * etaMinutes is null when coordinates are unavailable.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const osrmEtaCache = new Map(); // key → { etaMinutes, timestamp }
const CACHE_TTL_MS = 30_000;

export function useOsrmEta(busLat, busLng, studentLat, studentLng) {
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      busLat == null || busLng == null ||
      studentLat == null || studentLng == null
    ) {
      setEtaMinutes(null);
      return;
    }

    const bLat = Number(busLat);
    const bLng = Number(busLng);
    const sLat = Number(studentLat);
    const sLng = Number(studentLng);

    if (isNaN(bLat) || isNaN(bLng) || isNaN(sLat) || isNaN(sLng)) {
      setEtaMinutes(null);
      return;
    }

    const cacheKey = `${bLat.toFixed(4)},${bLng.toFixed(4)};${sLat.toFixed(4)},${sLng.toFixed(4)}`;
    const cached = osrmEtaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setEtaMinutes(cached.etaMinutes);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${bLng},${bLat};${sLng},${sLat}` +
      `?overview=false`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.routes?.[0]?.duration != null) {
          const mins = Math.max(1, Math.round(data.routes[0].duration / 60));
          osrmEtaCache.set(cacheKey, { etaMinutes: mins, timestamp: Date.now() });
          setEtaMinutes(mins);
        } else {
          throw new Error('OSRM: no route found');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Fallback: straight-line at ~30 km/h
        const distKm = haversineKm(busLat, busLng, studentLat, studentLng);
        const fallback = Math.max(1, Math.round(distKm * 2));
        setEtaMinutes(fallback);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [busLat, busLng, studentLat, studentLng]);

  return { etaMinutes, loading, error };
}
