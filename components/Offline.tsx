import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Visibility,
  Delete,
  CloudOff,
  Sync,
} from '@mui/icons-material';
import { useData } from '../context/DataContext';

const Offline: React.FC = () => {
  const { offlineQueue, isOnline, syncOfflineData } = useData();

  const handleSync = async () => {
    await syncOfflineData();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      default:
        return action;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Données hors ligne
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {offlineQueue.length} élément(s) en attente de synchronisation
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={handleSync}
          disabled={!isOnline || offlineQueue.length === 0}
        >
          Synchroniser
        </Button>
      </Box>

      {/* Status Alert */}
      {!isOnline && (
        <Alert
          severity="warning"
          icon={<CloudOff />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          Vous êtes hors ligne. Les modifications seront synchronisées une fois la connexion rétablie.
        </Alert>
      )}

      {isOnline && offlineQueue.length > 0 && (
        <Alert
          severity="info"
          icon={<Sync />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          Vous êtes en ligne. Cliquez sur "Synchroniser" pour envoyer vos modifications.
        </Alert>
      )}

      {/* Queue List */}
      {offlineQueue.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Sync sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Tout est synchronisé !
            </Typography>
            <Typography color="text.secondary">
              Aucune donnée en attente de synchronisation
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List>
            {offlineQueue.map((item, index) => (
              <ListItem
                key={`${item.id}-${index}`}
                divider={index < offlineQueue.length - 1}
                sx={{ py: 2 }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight={500}>
                        {item.data?.nom || item.data?.titre || item.id}
                      </Typography>
                      <Chip
                        label={item.type === 'projet' ? 'Projet' : 'Matériel'}
                        size="small"
                        color={item.type === 'projet' ? 'primary' : 'secondary'}
                      />
                      <Chip
                        label={getActionLabel(item.action)}
                        size="small"
                        variant="outlined"
                        color={
                          item.action === 'create'
                            ? 'success'
                            : item.action === 'delete'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </Box>
                  }
                  secondary={formatDate(item.timestamp)}
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" sx={{ mr: 1 }}>
                    <Visibility />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
};

export default Offline;
