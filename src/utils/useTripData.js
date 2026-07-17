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

  useEffect(() => {
    if (!route) return;

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
        } else {
          setTrip(null);
        }
        setLoading(false);
      });
    });

    return () => unsub();
  }, [route]);

  return { trip, tripId, loading };
}

/**
 * Listens to all attendance docs for a given tripId.
 * Returns { attendances, loading }
 * Each attendance: { id, studentId, studentName, faculty, status, lat, lng, ... }
 */
export function useTripAttendances(tripId) {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });

    return () => unsub();
  }, [tripId]);

  return { attendances, loading };
}

/**
 * Listens to attendance as a map keyed by studentId — optimised for driver views.
 * Returns { attendanceMap, loading }
 */
export function useDriverAttendanceMap(tripId) {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });

    return () => unsub();
  }, [tripId]);

  return { attendanceMap, loading };
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
