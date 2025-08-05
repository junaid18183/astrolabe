import React, { useState, useEffect } from 'react';
import { AstrolabeModule } from './astrolabe';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
} from '@mui/material';
import { KubeObjectInterface, KubeObject } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import {
  EditorDialog,
  EditButton,
  CreateButton,
  CreateResourceButton,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

export default function ModuleCreateForm() {
  const [apiVersion] = useState('astrolabe.io/v1');
  const [kind] = useState('Module');
  const [name, setName] = useState('testeksmodule');
  const [namespace, setNamespace] = useState('default');
  const [type, setType] = useState('git');
  const [url, setUrl] = useState('https://github.com/terraformawsmodules/terraformawseks.git');
  const [version, setVersion] = useState('v20.37.2');
  const [namespaces, setNamespaces] = useState<any[]>([]);
  const [nsError, setNsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openEditor, setOpenEditor] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  // Type options for source.type
  const typeOptions = [
    { value: 'git', label: 'Git' },
    { value: 'registry', label: 'Registry' },
    { value: 'local', label: 'Local' },
  ];

  // Fetch namespaces (mocked for now)
  useEffect(() => {
    // TODO: Replace with real fetch if needed
    setNamespaces([{ metadata: { name: 'default' } }]);
  }, []);

  // Build moduleResource from form state
  const moduleResource: KubeObjectInterface = {
    apiVersion,
    kind,
    metadata: {
      name,
      namespace,
      creationTimestamp: '',
      uid: '',
    },
    spec: {
      source: {
        type,
        url,
        version,
      },
    },
  };

  const handleCreateModule = () => {
    setError(null);
    setSuccess(null);
    // Validate required fields
    if (!name || !namespace || !type || !url) {
      setError('Please fill all required fields.');
      return;
    }
    setOpenEditor(true);
  };

  const handleSave = (resource: string) => {
    try {
      setOpenEditor(false);
      setErrorMessage(undefined);
      setSuccess('Module resource created!');
    } catch {
      setErrorMessage('Invalid YAML/JSON');
    }
  };

  return (
    <>
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
            </Grid>
            <Grid>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  console.log('Edit Module YAML button clicked');
                  setOpenEditor(true);
                }}
                sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Edit Module YAML
              </Button>
              <Dialog
                open={openEditor}
                onClose={() => setOpenEditor(false)}
                fullWidth
                maxWidth="md"
              >
                <DialogTitle>Create Module Resource</DialogTitle>
                <EditorDialog
                  item={new KubeObject(moduleResource)}
                  setOpen={setOpenEditor}
                  onClose={() => setOpenEditor(false)}
                  onSave={handleSave}
                  saveLabel="Apply"
                  errorMessage={errorMessage}
                  onEditorChanged={() => setErrorMessage(undefined)}
                  title="Module YAML Editor"
                />
              </Dialog>
            </Grid>
            {/* <Grid>
              <CreateButton isNarrow={false}></CreateButton>
            </Grid> */}
            {/* <Grid>
              <CreateResourceButton
                resourceClass={AstrolabeModule}
                resourceName="junedtestmodule"
              />
            </Grid> */}
            {/* <Grid>
              <EditButton
                buttonStyle="action"
                item={new KubeObject(moduleResource)}
                afterConfirm={() => setOpenEditor(true)}
              />
            </Grid> */}
          </CardContent>
        </Card>
      </SectionBox>
    </>
  );
}
