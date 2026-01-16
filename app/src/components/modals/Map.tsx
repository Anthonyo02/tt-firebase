import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Close, MyLocation, Map as MapIcon } from "@mui/icons-material";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerModalProps {
  open: boolean;
  onClose: () => void;
  onValidate: (location: string) => void;
  initialValue?: string;
}

// Détection des in-app browsers (WhatsApp, Messenger, Instagram, etc.)
const isInAppBrowser = (): boolean => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

  const inAppPatterns = [
    /FBAN|FBAV|FB_IAB/i,     // Facebook
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

// Composant pour gérer les clics sur la carte
function LocationMarker({
  position,
  setPosition,
}: {
  position: L.LatLng | null;
  setPosition: (pos: L.LatLng) => void;
}) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? <Marker position={position} /> : null;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({
  open,
  onClose,
  onValidate,
  initialValue = "",
}) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [manualLink, setManualLink] = useState(initialValue);
  const [geoError, setGeoError] = useState("");

  const isInApp = isInAppBrowser();

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (open) {
      setManualLink(initialValue);
      setPosition(null);
      setGeoError("");
    }
  }, [open, initialValue]);

  const handleValidate = () => {
    if (position) {
      const googleMapsLink = `https://www.google.com/maps?q=${position.lat},${position.lng}`;
      onValidate(googleMapsLink);
    } else if (manualLink.trim()) {
      onValidate(manualLink.trim());
    }
    onClose();
  };

  const handleGetLocation = () => {
    if (isInApp) return; // pas d'appel si in-app browser

    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
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
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        {/* Message d'avertissement pour les in-app browsers */}
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
              La détection automatique de votre position ne fonctionne pas dans cette
              application (WhatsApp, Messenger, Instagram, etc.).
            </Typography>
            <Typography variant="body2" color="warning.dark" sx={{ mt: 1 }}>
              <strong>Ouvrez le lien directement dans Safari ou Chrome</strong> pour
              utiliser cette fonctionnalité.
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          label="Saisir manuellement une adresse ou un lien"
          value={manualLink}
          onChange={(e) => setManualLink(e.target.value)}
          placeholder="https://www.google.com/maps/... ou 123 Rue de Paris"
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleGetLocation}
                  color="primary"
                  title="Ma position actuelle"
                  disabled={isInApp} // désactive le bouton quand on est dans un in-app browser
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
          Ou cliquez sur la carte pour sélectionner un lieu :
        </Typography>

        <Box
          sx={{
            height: 400,
            borderRadius: 2,
            overflow: "hidden",
            border: "2px solid #e0e0e0",
          }}
        >
          <MapContainer
            center={position ? [position.lat, position.lng] : [48.8566, 2.3522]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
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