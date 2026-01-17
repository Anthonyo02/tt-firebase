"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Close, MyLocation, Map as MapIcon } from "@mui/icons-material";

interface MapPickerModalProps {
  open: boolean;
  onClose: () => void;
  onValidate: (location: string) => void;
  initialValue?: string;
}

const isInAppBrowser = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  const inAppPatterns = [
    /FBAN|FBAV|FB_IAB/i,
    /Instagram/i,
    /Twitter/i,
    /Line/i,
    /Snapchat/i,
    /Pinterest/i,
    /WhatsApp/i,
    /TikTok/i,
    /WeChat/i,
    /LinkedIn/i,
    /Messenger/i,
  ];
  return inAppPatterns.some((regex) => regex.test(ua));
};

const MapPickerModal: React.FC<MapPickerModalProps> = ({
  open,
  onClose,
  onValidate,
  initialValue = "",
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLink, setManualLink] = useState(initialValue);
  const [geoError, setGeoError] = useState("");
  const [isMapLoading, setIsMapLoading] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const isInApp = isInAppBrowser();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setManualLink(initialValue);
      setPosition(null);
      setGeoError("");
      setIsMapLoading(true);
    }
  }, [open, initialValue]);

  // Initialize map when dialog is open
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    let map: any = null;
    let marker: any = null;

    const initMap = async () => {
      // Wait for dialog animation to complete
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (!isMounted || !mapContainerRef.current) return;

      try {
        // Dynamically import Leaflet
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        if (!isMounted || !mapContainerRef.current) return;

        leafletRef.current = L.default || L;

        // Fix icons
        delete (leafletRef.current.Icon.Default.prototype as any)._getIconUrl;
        leafletRef.current.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // Clean container before initializing
        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) {
          delete (container as any)._leaflet_id;
        }
        container.innerHTML = "";

        // Create map
        map = leafletRef.current.map(container, {
          center: [48.8566, 2.3522],
          zoom: 13,
          scrollWheelZoom: true,
        });

        mapInstanceRef.current = map;

        // Add tile layer
        leafletRef.current
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
          })
          .addTo(map);

        // Handle click
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;

          // Remove old marker
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          marker = leafletRef.current.marker([lat, lng]).addTo(map);
          markerRef.current = marker;

          setPosition({ lat, lng });
          map.flyTo([lat, lng], map.getZoom());
        });

        // Fix map size after render
        setTimeout(() => {
          if (map && isMounted) {
            map.invalidateSize();
          }
        }, 100);

        if (isMounted) {
          setIsMapLoading(false);
        }
      } catch (error) {
        console.error("Error initializing map:", error);
        if (isMounted) {
          setIsMapLoading(false);
        }
      }
    };

    initMap();

    // Cleanup function
    return () => {
      isMounted = false;

      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch (e) {}
        markerRef.current = null;
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }

      // Clean container
      if (mapContainerRef.current) {
        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) {
          delete (container as any)._leaflet_id;
        }
        container.innerHTML = "";
      }
    };
  }, [open]);

  const handleGetLocation = useCallback(() => {
    if (isInApp) return;

    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPosition({ lat, lng });

        if (mapInstanceRef.current && leafletRef.current) {
          // Remove old marker
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          const marker = leafletRef.current.marker([lat, lng]).addTo(mapInstanceRef.current);
          markerRef.current = marker;

          mapInstanceRef.current.flyTo([lat, lng], 15);
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Permission de géolocalisation refusée");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Position non disponible");
            break;
          case error.TIMEOUT:
            setGeoError("Délai de géolocalisation dépassé");
            break;
          default:
            setGeoError("Erreur de géolocalisation");
        }
      }
    );
  }, [isInApp]);

  const handleValidate = useCallback(() => {
    if (position) {
      const googleMapsLink = `https://www.google.com/maps?q=${position.lat},${position.lng}`;
      onValidate(googleMapsLink);
    } else if (manualLink.trim()) {
      onValidate(manualLink.trim());
    }
    onClose();
  }, [position, manualLink, onValidate, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      keepMounted={false}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #818660 0%, #9ba17b 50%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
          position: "relative",
        }}
      >
        <MapIcon />
        Sélectionner un lieu
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white",
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, mt: 3 }}>
        {isInApp && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "warning.light",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "warning.main",
            }}
          >
            <Typography variant="body1" fontWeight="medium" color="warning.dark">
              La détection automatique ne fonctionne pas dans cette application.
            </Typography>
            <Typography variant="body2" color="warning.dark" sx={{ mt: 1 }}>
              <strong>Ouvrez dans Safari ou Chrome</strong>
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          label="Chercher"
          value={manualLink}
          onChange={(e) => setManualLink(e.target.value)}
          placeholder="https://www.google.com/maps/..."
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleGetLocation}
                  color="primary"
                  title="Ma position actuelle"
                  disabled={isInApp}
                >
                  <MyLocation />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {geoError && (
          <Typography color="error" variant="caption" sx={{ mb: 1, display: "block" }}>
            {geoError}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Cliquez sur la carte pour sélectionner un lieu :
        </Typography>

        <Box
          sx={{
            height: 400,
            borderRadius: 2,
            overflow: "hidden",
            border: "2px solid #e0e0e0",
            position: "relative",
          }}
        >
          {/* Loading overlay */}
          {isMapLoading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#f5f5f5",
                zIndex: 1000,
              }}
            >
              <CircularProgress size={40} />
              <Typography sx={{ ml: 2 }} color="text.secondary">
                Chargement de la carte...
              </Typography>
            </Box>
          )}

          {/* Map container */}
          <div
            ref={mapContainerRef}
            style={{
              height: "100%",
              width: "100%",
            }}
          />
        </Box>

        {position && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: "rgba(97, 102, 55, 0.1)",
              borderRadius: 1,
              border: "1px solid rgba(97, 102, 55, 0.3)",
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              📍 Position sélectionnée :
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Latitude: {position.lat.toFixed(6)}, Longitude: {position.lng.toFixed(6)}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)" }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleValidate}
          disabled={!position && !manualLink.trim()}
        >
          Valider
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapPickerModal;