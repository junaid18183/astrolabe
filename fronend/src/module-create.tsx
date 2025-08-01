import React, { useState } from 'react';
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
import Namespace from '@kinvolk/headlamp-plugin/lib/K8s/namespace';
import { AstrolabeModule } from './astrolabe';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';

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
  const [yamlDialogOpen, setYamlDialogOpen] = useState(false);
  const [yamlValue, setYamlValue] = useState('');

  const handleReviewYaml = () => {
    setSuccess('');
    const resource = {
      apiVersion,
      kind,
      metadata: { name, namespace },
      spec: { source: { type, url, version } },
    };
    setYamlValue(JSON.stringify(resource, null, 2));
    setYamlDialogOpen(true);
  };

  const handleYamlCreate = async (yamlStr: string) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const resourceObj = JSON.parse(yamlStr);
      const result = await AstrolabeModule.create(resourceObj);
      if (result && result.metadata && result.metadata.name) {
        setSuccess('Module created successfully!');
        setName('');
        setNamespace('default');
        setType('git');
        setUrl('');
        setVersion('');
        setYamlDialogOpen(false);
        if (typeof window !== 'undefined') {
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        setError('API call did not return a valid module resource.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create module');
    }
    setLoading(false);
  };

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
                  namespaces.map((ns: any) => {
                    const nsName = ns.metadata?.name || '-';
                    return (
                      <MenuItem key={nsName} value={nsName}>
                        {nsName}
                      </MenuItem>
                    );
                  })
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
                onClick={handleReviewYaml}
              >
                Review YAML & Create
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
      {yamlDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Card sx={{ maxWidth: 700, width: '100%', p: 2 }}>
            <CardHeader title={<Typography variant="h6">Review & Create Module YAML</Typography>} />
            <CardContent>
              <TextField
                label="Module YAML (JSON)"
                value={yamlValue}
                onChange={e => setYamlValue(e.target.value)}
                multiline
                minRows={12}
                maxRows={24}
                fullWidth
                variant="outlined"
                sx={{ fontFamily: 'monospace', mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleYamlCreate(yamlValue)}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Module'}
                </Button>
                <Button variant="outlined" onClick={() => setYamlDialogOpen(false)}>
                  Cancel
                </Button>
              </Box>
              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </SectionBox>
  );
}

export default ModuleCreateForm;
