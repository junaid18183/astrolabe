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
import { SectionBox, CreateButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObjectInterface, KubeObject } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';

function ModuleCreateForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('test-eks-module');
  const [namespace, setNamespace] = useState('default');
  const [namespaces, nsError] = Namespace.useList();
  const [type, setType] = useState('git');
  const [url, setUrl] = useState('https://github.com/terraform-aws-modules/terraform-aws-eks.git');
  const [version, setVersion] = useState('v20.37.2');
  const typeOptions = [
    { value: 'git', label: 'Git' },
    { value: 'http', label: 'HTTP' },
  ];
  const apiVersion = 'astrolabe.io/v1';
  const kind = 'Module';

  // Build the resource object dynamically for live YAML preview
  const resource: KubeObjectInterface = {
    apiVersion,
    kind,
    metadata: {
      name,
      namespace,
      creationTimestamp: undefined,
      uid: undefined,
    },
    spec: { source: { type, url, version } },
  };

  // Live YAML value
  const yamlLiveValue = JSON.stringify(resource, null, 2);

  return (
    <SectionBox title="Create Module">
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          maxWidth: 900,
          margin: '0 auto',
          bgcolor: theme => (theme.palette.mode === 'dark' ? '#23272f' : '#fff'),
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
            {/* Left: Form */}
            <Box sx={{ flex: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={12}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    Create New Module
                  </Typography>
                </Grid>
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
                {/* Message after form fields */}
                <Grid item xs={12}>
                  <Typography
                    sx={{
                      mt: 2,
                      mb: 2,
                      fontWeight: 700,
                      color: 'error.main',
                      bgcolor: '#ffeaea',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                    }}
                  >
                    Copy the YAML and Click on Create
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            {/* Right: YAML Preview */}
            <Box
              sx={{
                flex: 1,
                bgcolor: theme => (theme.palette.mode === 'dark' ? '#18181b' : '#f8fafc'),
                borderRadius: 2,
                p: 2,
                boxShadow: 1,
                fontFamily: 'monospace',
                fontSize: 14,
                minHeight: 400,
                maxHeight: 600,
                overflow: 'auto',
                whiteSpace: 'pre',
              }}
            >
              {yamlLiveValue}
            </Box>
          </Box>
          {/* Bottom: Create Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <CreateButton isNarrow={false} />
          </Box>
        </CardContent>
      </Card>
    </SectionBox>
  );
}

export default ModuleCreateForm;
