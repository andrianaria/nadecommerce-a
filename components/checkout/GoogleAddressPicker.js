import { useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/Checkout.module.css";

function formatLatLng(lat, lng) {
  if (lat == null || lng == null) return "";
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
}

export default function GoogleAddressPicker({
  apiKey,
  value,
  onChange,
  lat,
  lng,
  onCoordsChange,
  onPlaceIdChange,
  required,
  disabled,
  helper
}) {
  const { copy } = useStoreLanguage();
  const inputRef = useRef(null);
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const hasCoords = lat != null && lng != null;
  const center = useMemo(() => {
    if (hasCoords) return { lat: Number(lat), lng: Number(lng) };
    // Jakarta default
    return { lat: -6.175392, lng: 106.827153 };
  }, [hasCoords, lat, lng]);

  useEffect(() => {
    if (disabled) return;
    if (!apiKey) {
      setError(copy.mapsKeyMissing);
      return;
    }

    let cancelled = false;

    loadGoogleMaps({ apiKey })
      .then((google) => {
        if (cancelled) return;

        setReady(true);
        setError("");

        if (mapDivRef.current && !mapRef.current) {
          mapRef.current = new google.maps.Map(mapDivRef.current, {
            center,
            zoom: hasCoords ? 17 : 12,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false
          });

          markerRef.current = new google.maps.Marker({
            position: center,
            map: mapRef.current,
            draggable: true
          });

          geocoderRef.current = new google.maps.Geocoder();

          markerRef.current.addListener("dragend", async () => {
            const pos = markerRef.current?.getPosition?.();
            if (!pos) return;

            const nextLat = pos.lat();
            const nextLng = pos.lng();
            onCoordsChange?.(nextLat, nextLng);

            try {
              const geocoder = geocoderRef.current;
              if (!geocoder) return;

              const result = await geocoder.geocode({
                location: { lat: nextLat, lng: nextLng }
              });

              const nextAddress = result?.results?.[0]?.formatted_address;
              if (nextAddress) {
                onChange?.(nextAddress);
              }
            } catch {
              // ignore reverse geocode errors
            }
          });
        }

        if (inputRef.current && !inputRef.current.__streetSushiAutocomplete) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ["place_id", "formatted_address", "geometry", "name"],
            componentRestrictions: { country: "id" }
          });

          inputRef.current.__streetSushiAutocomplete = autocomplete;

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place) return;

            const formatted = place.formatted_address || place.name || "";
            if (formatted) {
              onChange?.(formatted);
            }

            if (place.place_id) {
              onPlaceIdChange?.(place.place_id);
            }

            const loc = place.geometry?.location;
            if (loc) {
              const nextLat = loc.lat();
              const nextLng = loc.lng();
              onCoordsChange?.(nextLat, nextLng);
              mapRef.current?.setCenter?.({ lat: nextLat, lng: nextLng });
              mapRef.current?.setZoom?.(17);
              markerRef.current?.setPosition?.({ lat: nextLat, lng: nextLng });
            }
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || copy.mapsLoadFailed);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, center, copy.mapsKeyMissing, copy.mapsLoadFailed, disabled, hasCoords, onChange, onCoordsChange, onPlaceIdChange]);

  useEffect(() => {
    if (!disabled) return;
    // Reset any transient map errors when user switches to pickup.
    setError("");
  }, [disabled]);

  useEffect(() => {
    if (!ready) return;
    if (!mapRef.current || !markerRef.current) return;
    if (!hasCoords) return;

    const next = { lat: Number(lat), lng: Number(lng) };
    markerRef.current.setPosition(next);
    mapRef.current.setCenter(next);
  }, [hasCoords, lat, lng, ready]);

  async function useMyLocation() {
    if (!navigator?.geolocation) {
      setError(copy.browserNoLocation);
      return;
    }

    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        onCoordsChange?.(nextLat, nextLng);
        mapRef.current?.setCenter?.({ lat: nextLat, lng: nextLng });
        mapRef.current?.setZoom?.(17);
        markerRef.current?.setPosition?.({ lat: nextLat, lng: nextLng });
      },
      () => setError(copy.browserLocationFailed),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <div className={styles.mapPicker}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={copy.addressSearchPlaceholder}
        required={required}
        disabled={disabled}
      />

      <div className={styles.mapPickerMeta}>
        <span className={styles.mapPickerHint}>
          {helper || copy.mapHelper}
        </span>
        <button type="button" className={styles.mapPickerButton} onClick={useMyLocation} disabled={disabled}>
          {copy.useMyLocation}
        </button>
      </div>

      {error ? <div className={styles.mapPickerError}>{error}</div> : null}

      <div className={styles.mapCanvasWrap}>
        <div ref={mapDivRef} className={styles.mapCanvas} />
        {!apiKey ? <div className={styles.mapCanvasOverlay}>{copy.mapsNotEnabled}</div> : null}
      </div>

      {hasCoords ? (
        <div className={styles.mapPickerCoords}>
          {copy.pinLabel}: {formatLatLng(lat, lng)}
        </div>
      ) : (
        <div className={styles.mapPickerCoords}>
          {copy.pinLabel}: {copy.pinNotSelected}
        </div>
      )}
    </div>
  );
}
