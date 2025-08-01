import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Namespace from '@kinvolk/headlamp-plugin/lib/K8s/namespace';
import { AstrolabeModule } from './astrolabe';

function ModuleCreateForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [namespaces, nsError] = Namespace.useList();
  const [type, setType] = useState('git');
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('');

  const typeOptions = [
    { value: 'git', label: 'Git' },
    { value: 'http', label: 'HTTP' },
  ];
  const apiVersion = 'astrolabe.io/v1';
  const kind = 'Module';

  const resetForm = useCallback(() => {
    setName('');
    setNamespace('default');
    setType('git');
    setUrl('');
    setVersion('');
  }, []);

  const handleCreateModule = useCallback(async () => {
    setSuccess('');
    setError('');
    setLoading(true);

    const resource = {
      apiVersion,
      kind,
      metadata: { name, namespace },
      spec: { source: { type, url, version } },
    };

    try {
      const result = await AstrolabeModule.create(resource);
      if (result?.metadata?.name) {
        setSuccess('Module created successfully!');
        resetForm();
        if (typeof window !== 'undefined') {
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        setError('API call did not return a valid module resource.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to create module');
    }
    setLoading(false);
  }, [name, namespace, type, url, version, resetForm]);

  return (
    <SectionBox title="Create Module">
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          maxWidth: 600,
          margin: '0 auto',
          bgcolor: theme => (theme.palette.mode === 'dark' ? '#23272f' : '#fff'),
        }}
      >
        <CardHeader
          title={
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Create New Module
            </Typography>
          }
          sx={{
            bgcolor: theme => (theme.palette.mode === 'dark' ? '#18181b' : '#f8fafc'),
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="apiVersion"
                value={apiVersion}
                InputProps={{ readOnly: true }}
                fullWidth
                variant="filled"
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="kind"
                value={kind}
                InputProps={{ readOnly: true }}
                fullWidth
                variant="filled"
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Namespace"
                value={namespace}
                onChange={e => setNamespace(e.target.value)}
                select
                required
                fullWidth
                variant="outlined"
                helperText={nsError ? 'Error loading namespaces' : ''}
              >
                {Array.isArray(namespaces) && namespaces.length > 0 ? (
                  namespaces.map((ns: any) => (
                    <MenuItem key={ns.metadata.name} value={ns.metadata.name}>
                      {ns.metadata.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="default">default</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Type"
                value={type}
                onChange={e => setType(e.target.value)}
                select
                required
                fullWidth
                variant="outlined"
              >
                {typeOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Version"
                value={version}
                onChange={e => setVersion(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                sx={{ py: 1.5, fontWeight: 600, borderRadius: 2, boxShadow: 2 }}
                onClick={handleCreateModule}
                disabled={loading}
              >
                Create Module
              </Button>
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Typography color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              </Grid>
            )}
            {success && (
              <Grid item xs={12}>
                <Typography color="success.main" sx={{ mt: 1 }}>
                  {success}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </SectionBox>
  );
}

export default ModuleCreateForm;
