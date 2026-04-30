'use client'

import { useState, useEffect } from 'react'

interface Location {
  latitude: number
  longitude: number
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser';
        setError(msg);
        reject(msg);
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(loc);
          setLoading(false);
          setError(null);
          resolve(loc);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          reject(err.message);
        }
      );
    });
  };

  return { location, error, loading, getLocation }
}
