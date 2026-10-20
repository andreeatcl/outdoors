import { useState, useEffect } from "react";

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalizarea nu este suportată.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => setCoords({ lat: c.latitude, lng: c.longitude }),
      (e) => setError(e.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { coords, error };
}
