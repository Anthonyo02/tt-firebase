import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Slide,
  Paper,
  Grid,
} from '@mui/material';
import {
  CalendarToday,
  Person,
  Group,
  Inventory2,
  Close,
  Visibility,
  LocationOn,
  Link as LinkIcon,
  Description,
  Comment,
  CheckCircle,
  Cancel,
  HourglassEmpty,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { Projet } from '../../context/DataContext';

/* =======================
   TRANSITION
======================= */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ProjetViewModalProps {
  open: boolean;
  projet: Projet | null;
  onClose: () => void;
  // onEdit: () => void;
}

const ProjetViewModal: React.FC<ProjetViewModalProps> = ({ open, projet, onClose }) => {
  if (!projet) return null;

  /* =======================
     HELPERS
  ======================= */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'terminer':
        return { label: 'Terminé', color: 'success' as const, icon: <CheckCircle fontSize="small" /> };
      case 'annuller':
        return { label: 'Annulé', color: 'error' as const, icon: <Cancel fontSize="small" /> };
      default:
        return { label: 'En cours', color: 'warning' as const, icon: <HourglassEmpty fontSize="small" /> };
    }
  };

  const statusConfig = getStatusConfig(projet.status);

  const parseMateriel = () => {
    let materiel = projet.materiel;
    if (typeof materiel === 'string') {
      try {
        materiel = JSON.parse(materiel);
      } catch {
        return [];
      }
    }
    return materiel || [];
  };

  const materielList = parseMateriel();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
    >
      {/* =======================
          HEADER
      ======================= */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #818660 0%, #9ba17b 50%, #6b7052 100%)',
          position: 'relative',
          overflow: 'hidden',
          py: 3,
          px: 3,
        }}
      >
        {/* Cercle décoratif */}
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            top: -100,
            right: -50,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 150,
            height: 150,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
            bottom: -50,
            left: -30,
          }}
        />

        {/* Bouton fermer */}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12, color: 'white' }}
        >
          <Close />
        </IconButton>

        {/* Titre et statut */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}
          >
            <Visibility />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} color="white" sx={{ mb: 0.5 }}>
              {projet.titre}
            </Typography>
            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
              sx={{ 
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'inherit' }
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* =======================
          CONTENU
      ======================= */}
      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Dates */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              bgcolor: 'rgba(129, 134, 96, 0.08)', 
              borderRadius: 3,
              border: '1px solid rgba(129, 134, 96, 0.15)'
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ color: '#818660', fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Date début
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatDate(projet.date_debut)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ color: '#6b7052', fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Date fin
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {projet.date_fin ? formatDate(projet.date_fin) : '—'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
          </Paper>

          {/* Lieu */}
          {(projet.lieu || projet.lieu_link) && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOn sx={{ color: '#818660' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Lieu
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 4 }}>
                {projet.lieu && (
                  <Typography fontWeight={500}>{projet.lieu}</Typography>
                )}
                {projet.lieu_link && (
                  <Chip
                    icon={<LinkIcon fontSize="small" />}
                    label="Voir sur la carte"
                    size="small"
                    clickable
                    component="a"
                    href={projet.lieu_link}
                    target="_blank"
                    sx={{ bgcolor: '#818660', color: 'white' }}
                  />
                )}
              </Box>
            </Box>
          )}

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Responsable */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Person sx={{ color: '#818660' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Responsable
              </Typography>
            </Box>
            <Box sx={{ pl: 4 }}>
              <Chip 
                avatar={<Avatar sx={{ bgcolor: '#818660' }}>{projet.responsable?.charAt(0)}</Avatar>}
                label={projet.responsable} 
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Box>

          {/* Équipe */}
          {projet.equipe && projet.equipe.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Group sx={{ color: '#818660' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Équipe ({projet.equipe.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pl: 4 }}>
                {projet.equipe.map((member, index) => (
                  <Chip 
                    key={index} 
                    avatar={<Avatar sx={{ bgcolor: '#9ba17b' }}>{member.charAt(0)}</Avatar>}
                    label={member} 
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Matériel */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Inventory2 sx={{ color: '#818660' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Matériel utilisé ({materielList.length})
              </Typography>
            </Box>
            <Box sx={{ pl: 4 }}>
              {materielList.length === 0 ? (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Aucun matériel assigné
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {materielList.map((m: any, index: number) => (
                    <Chip
                      key={index}
                      label={`${m.nom} ×${m.utiliser}`}
                      size="small"
                      sx={{ 
                        bgcolor: '#616637', 
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>

          {/* Détail */}
          {projet.detail && (
            <>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Description sx={{ color: '#818660' }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Détail
                  </Typography>
                </Box>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    ml: 4,
                    bgcolor: 'rgba(0,0,0,0.02)', 
                    borderRadius: 2,
                    borderLeft: '3px solid #818660'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {projet.detail}
                  </Typography>
                </Paper>
              </Box>
            </>
          )}

          {/* Commentaire */}
          {projet.commentaire && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Comment sx={{ color: '#818660' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Commentaire
                </Typography>
              </Box>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  ml: 4,
                  bgcolor: 'rgba(0,0,0,0.02)', 
                  borderRadius: 2,
                  borderLeft: '3px solid #9ba17b'
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {projet.commentaire}
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* =======================
          FOOTER
      ======================= */}
      <DialogActions sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)' }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{ 
            bgcolor: '#818660',
            '&:hover': { bgcolor: '#6b7052' },
            borderRadius: 2,
            px: 4,
          }}
        >
          Fermer
        </Button>
        <Button 
          // onClick={onEdit} 
          variant="contained"
          sx={{ 
            bgcolor: '#818660',
            '&:hover': { bgcolor: '#6b7052' },
            borderRadius: 2,
            px: 4,
          }}
        >
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjetViewModal;