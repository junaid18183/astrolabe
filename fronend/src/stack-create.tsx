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
import Secret from '@kinvolk/headlamp-plugin/lib/K8s/secret';
import { AstrolabeModule } from './astrolabe';
import { SectionBox, CreateButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';

function StackCreateForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('aws-vpc-demo');
  const [namespace, setNamespace] = useState('default');
  const [namespaces, nsError] = Namespace.useList();
  const [secrets, secretError] = Secret.useList();
  const [credentialRef, setSecret] = useState();
  const [backendType, setBackendType] = useState('local');
  const [backendSettings, setBackendSettings] = useState();
  const [modules, setModules] = useState([{ name: '', dependsOn: [], variables: {} }]);
  const [availableModules, modulesError] = AstrolabeModule.useList();
  const moduleResources = modules.map(mod => AstrolabeModule.useGet(mod.name, namespace));
  const moduleInputs = moduleResources.map(([modResource]) => {
    const inputs = modResource?.jsonData?.status?.inputs || [];
    return inputs.filter((input: any) => input.required && input.default === undefined);
  });

  const apiVersion = 'astrolabe.io/v1';
  const kind = 'Stack';

  const resource = {
    apiVersion,
    kind,
    metadata: {
      name,
      namespace,
      creationTimestamp: undefined,
      uid: undefined,
    },
    spec: {
      backendConfig: {
        type: backendType,
        settings: JSON.parse(backendSettings || '{}'),
      },
      credentialRef: credentialRef ? { name: credentialRef } : undefined,
      modules: modules.map(m => ({
        name: m.name,
        dependsOn: m.dependsOn,
        variables: m.variables,
      })),
    },
  };

  // Live YAML value
  const yamlLiveValue = JSON.stringify(resource, null, 2);

  // Module fields handlers
  const handleModuleChange = (idx, field, value) => {
    const updated = modules.map((m, i) => (i === idx ? { ...m, [field]: value } : m));
    setModules(updated);
  };

  // Helper to get type of a variable from moduleInputs
  const getVariableType = (modIdx, varName) => {
    const input = moduleInputs[modIdx]?.find(inp => inp.name === varName);
    return input?.type || 'string';
  };

  // Validation for variable value based on type
  const validateVariableValue = (type, value) => {
    if (type === 'number') {
      return /^-?\d+(\.\d+)?$/.test(value);
    }
    if (type === 'boolean') {
      return value === 'true' || value === 'false';
    }
    // Add more type checks as needed
    return true;
  };

  const handleVariableChange = (modIdx, varName, value) => {
    const type = getVariableType(modIdx, varName);
    if (!validateVariableValue(type, value)) {
      setError(`Invalid value for variable '${varName}' (type: ${type})`);
      return;
    }
    setError('');
    const updated = modules.map((m, i) => {
      if (i !== modIdx) return m;
      return {
        ...m,
        variables: {
          ...m.variables,
          [varName]: value,
        },
      };
    });
    setModules(updated);
  };

  const handleAddModule = () => {
    setModules([...modules, { name: '', dependsOn: [], variables: {} }]);
  };

  const handleRemoveModule = idx => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top row: Create Stack and YAML Preview side by side */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <SectionBox title="Create Stack">
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
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                      Create New Stack
                    </Typography>
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
                      onChange={e => {
                        setNamespace(e.target.value);
                        setSecret(undefined); // Reset credentialRef when namespace changes
                      }}
                      required
                      fullWidth
                      variant="outlined"
                      select
                      helperText={nsError ? 'Error loading namespaces' : ''}
                    >
                      {Array.isArray(namespaces) && namespaces.length > 0 ? (
                        namespaces.map((ns: any) => (
                          <MenuItem key={ns.metadata?.name} value={ns.metadata?.name}>
                            {ns.metadata?.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="">No namespaces found</MenuItem>
                      )}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Credential Reference"
                      value={credentialRef || ''}
                      onChange={e => setSecret(e.target.value)}
                      required
                      fullWidth
                      variant="outlined"
                      select
                      helperText={secretError ? 'Error loading secrets' : ''}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {Array.isArray(secrets) &&
                      secrets.filter((s: any) => s.metadata?.namespace === namespace).length > 0 ? (
                        secrets
                          .filter((s: any) => s.metadata?.namespace === namespace)
                          .map((s: any) => (
                            <MenuItem key={s.metadata?.name} value={s.metadata?.name}>
                              {s.metadata?.name}
                            </MenuItem>
                          ))
                      ) : (
                        <MenuItem value="">No secrets found in this namespace</MenuItem>
                      )}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Backend Type"
                      value={backendType}
                      onChange={e => setBackendType(e.target.value)}
                      required
                      fullWidth
                      variant="outlined"
                      select
                    >
                      <MenuItem value="local">Local</MenuItem>
                      <MenuItem value="remote">Remote</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Backend Settings"
                      value={backendSettings}
                      onChange={e => setBackendSettings(e.target.value)}
                      fullWidth
                      variant="outlined"
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>Modules</Typography>
                    {modules.map((mod, idx) => (
                      <Box
                        key={idx}
                        sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={3}>
                            <TextField
                              label="Module Name"
                              value={mod.name}
                              onChange={e => handleModuleChange(idx, 'name', e.target.value)}
                              required
                              fullWidth
                              variant="outlined"
                              select
                              helperText={modulesError ? 'Error loading modules' : ''}
                            >
                              {Array.isArray(availableModules) && availableModules.length > 0 ? (
                                availableModules.map((m: any) => {
                                  const mName = m.metadata?.name || '-';
                                  return (
                                    <MenuItem key={mName} value={mName}>
                                      {mName}
                                    </MenuItem>
                                  );
                                })
                              ) : (
                                <MenuItem value="">No modules found</MenuItem>
                              )}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={9}>
                            {/* Table of required variables for selected module */}
                            {mod.name && moduleInputs[idx]?.length > 0 ? (
                              <Box>
                                <table
                                  style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: 14,
                                  }}
                                >
                                  <thead>
                                    <tr style={{ background: '#f3f3f3' }}>
                                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>
                                        Variable Name
                                      </th>
                                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>
                                        Variable Value
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {moduleInputs[idx].map((input: any) => (
                                      <tr key={input.name}>
                                        <td style={{ padding: '4px 8px', fontWeight: 500 }}>
                                          {input.name}
                                        </td>
                                        <td style={{ padding: '4px 8px' }}>
                                          <TextField
                                            size="small"
                                            variant="outlined"
                                            value={mod.variables[input.name] || ''}
                                            onChange={e =>
                                              handleVariableChange(idx, input.name, e.target.value)
                                            }
                                            placeholder={input.description || ''}
                                            fullWidth
                                            type={
                                              input.type === 'number'
                                                ? 'number'
                                                : input.type === 'boolean'
                                                ? 'text'
                                                : 'text'
                                            }
                                            error={
                                              !!mod.variables[input.name] &&
                                              !validateVariableValue(
                                                input.type,
                                                mod.variables[input.name]
                                              )
                                            }
                                            helperText={
                                              !!mod.variables[input.name] &&
                                              !validateVariableValue(
                                                input.type,
                                                mod.variables[input.name]
                                              )
                                                ? `Invalid value for type ${input.type}`
                                                : ''
                                            }
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ color: '#888', mt: 1 }}>
                                Select a module to see required variables
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              color="error"
                              variant="outlined"
                              size="small"
                              onClick={() => handleRemoveModule(idx)}
                              disabled={modules.length === 1}
                            >
                              Remove
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                    <Button variant="contained" onClick={handleAddModule}>
                      Add Module
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </SectionBox>
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionBox title="YAML Preview">
            <Box
              sx={{
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
          </SectionBox>
        </Grid>
      </Grid>
      {/* Bottom row: Editor full width */}
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <SectionBox title="Editor">
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <CreateButton isNarrow={false} />
            </Box>
          </SectionBox>
        </Grid>
      </Grid>
    </Box>
  );
}
export default StackCreateForm;
