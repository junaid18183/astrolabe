import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import Namespace from '@kinvolk/headlamp-plugin/lib/K8s/namespace';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/K8s/crd';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  ConditionsTable,
  Link,
  Loader,
  MainInfoSection,
  NameValueTable,
  SectionBox,
  StatusLabel,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

// Define functions that return the Astrolabe Resource Classes
const astrolabeGroup = 'astrolabe.io';
const astrolabeVersion = 'v1';

const AstrolabeModule = makeCustomResourceClass({
  apiInfo: [{ group: astrolabeGroup, version: astrolabeVersion }],
  isNamespaced: true,
  singularName: 'Module',
  pluralName: 'modules',
});

// Define Detail View Wrapper Components
function ModuleListView() {
  const [modules, error] = AstrolabeModule.useList();

  if (error) {
    // @ts-ignore Error type is not well defined
    return <div>Error loading modules: {(error as Error).message}</div>;
  }
  if (!modules) {
    return <Loader />;
  }

  return (
    <SectionBox title="Modules">
      <Table
        columns={[
          {
            header: 'Name',
            accessorFn: (module: KubeObjectInterface) => {
              const { metadata = {} } = module.jsonData || {};
              const name = module.getName ? module.getName() : metadata?.name || '-';
              const namespace = module.getNamespace
                ? module.getNamespace()
                : metadata?.namespace || '-';
              const clusterName = module._clusterName || '-';
              return name !== '-' && namespace !== '-' ? (
                <Link routeName="module" params={{ namespace, name }} tooltip={name}>
                  {name}
                </Link>
              ) : (
                <span>{name}</span>
              );
            },
          },
          {
            header: 'Namespace',
            accessorFn: (module: KubeObjectInterface) =>
              module.getNamespace
                ? module.getNamespace()
                : module.jsonData?.metadata?.namespace || '-',
          },
          {
            header: 'Source Type',
            accessorFn: (module: KubeObjectInterface) => module.jsonData?.spec?.source?.type || '-',
          },
          {
            header: 'Source URL',
            accessorFn: (module: KubeObjectInterface) => module.jsonData?.spec?.source?.url || '-',
          },
          {
            header: 'Version',
            accessorFn: (module: KubeObjectInterface) =>
              module.jsonData?.spec?.source?.version || '-',
          },
          {
            header: 'Status',
            accessorFn: (module: KubeObjectInterface) => {
              const status = module.jsonData?.status;
              const ready =
                status?.conditions &&
                status.conditions.some((c: any) => c.type === 'Ready' && c.status === 'True');
              return (
                <StatusLabel status={ready ? 'success' : 'warning'}>
                  {ready ? 'Ready' : 'Not Ready'}
                </StatusLabel>
              );
            },
          },
          {
            header: 'Last Synced',
            accessorFn: (module: KubeObjectInterface) => module.jsonData?.status?.lastSynced || '-',
          },
          {
            header: 'Cluster',
            accessorFn: (module: KubeObjectInterface) => module._clusterName || '-',
          },
          {
            header: 'Actions',
            accessorFn: (module: KubeObjectInterface) => {
              const { metadata = {} } = module.jsonData || {};
              const name = module.getName ? module.getName() : metadata?.name || '-';
              const namespace = module.getNamespace
                ? module.getNamespace()
                : metadata?.namespace || '-';
              const clusterName = module._clusterName || '-';
              return name !== '-' && namespace !== '-' ? (
                <Link routeName="module" params={{ namespace, name }} tooltip="View module">
                  <span className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                    View
                  </span>
                </Link>
              ) : (
                <span>-</span>
              );
            },
          },
        ]}
        data={modules}
      />
    </SectionBox>
  );
}

function ModuleDetailsView() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [item, error] = AstrolabeModule.useGet(name, namespace);

  if (error) {
    return <div>Error loading module: {(error as Error).message}</div>;
  }
  if (!item) {
    return <Loader />;
  }

  const { spec = {}, status = {}, metadata = {} } = item.jsonData || {};

  return (
    <Box
      sx={{
        bgcolor: theme => (theme.palette.mode === 'dark' ? '#18181b' : '#f8fafc'),
        borderRadius: 2,
        p: 2,
        boxShadow: 1,
      }}
    >
      <MainInfoSection
        resource={item}
        title={`Module: ${metadata.name}`}
        extraInfo={[
          { name: 'Namespace', value: metadata.namespace || '-' },
          { name: 'Source Type', value: spec.source?.type || '-' },
          { name: 'Source URL', value: spec.source?.url || '-' },
          { name: 'Source Path', value: spec.source?.path || '-' },
          { name: 'Version', value: spec.source?.version || '-' },
          { name: 'Description', value: status.description || '-' },
          { name: 'Last Synced', value: status.lastSynced || '-' },
        ]}
      />

      <SectionBox title="Providers">
        {Array.isArray(status.providers) && status.providers.length > 0 ? (
          <Table
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Version', accessorFn: (p: any) => p.version || '-' },
            ]}
            data={status.providers}
          />
        ) : (
          <NameValueTable rows={[{ name: 'No providers', value: '-' }]} />
        )}
      </SectionBox>

      <SectionBox title="Inputs">
        {Array.isArray(status.inputs) && status.inputs.length > 0 ? (
          <Table
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Description', accessorFn: (input: any) => input.description || '-' },
              {
                header: 'Default Value',
                accessorFn: (input: any) =>
                  input.default !== undefined ? String(input.default) : '-',
              },
              { header: 'Required', accessorFn: (input: any) => (input.required ? 'Yes' : 'No') },
            ]}
            data={status.inputs}
          />
        ) : (
          <NameValueTable rows={[{ name: 'No inputs', value: '-' }]} />
        )}
      </SectionBox>

      <SectionBox title="Outputs">
        {Array.isArray(status.outputs) && status.outputs.length > 0 ? (
          <Table
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Description', accessorFn: (output: any) => output.description || '-' },
              {
                header: 'Sensitive',
                accessorFn: (output: any) => (output.sensitive ? 'Yes' : 'No'),
              },
            ]}
            data={status.outputs}
          />
        ) : (
          <NameValueTable rows={[{ name: 'No outputs', value: '-' }]} />
        )}
      </SectionBox>

      <SectionBox title="Resources">
        {Array.isArray(status.resources) && status.resources.length > 0 ? (
          <Table
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Type', accessorKey: 'type' },
            ]}
            data={status.resources}
          />
        ) : (
          <NameValueTable rows={[{ name: 'No resources', value: '-' }]} />
        )}
      </SectionBox>

      <SectionBox title="Submodules">
        {Array.isArray(status.submodules) && status.submodules.length > 0 ? (
          <Table
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Source', accessorKey: 'source' },
            ]}
            data={status.submodules}
          />
        ) : (
          <NameValueTable rows={[{ name: 'No submodules', value: '-' }]} />
        )}
      </SectionBox>

      <SectionBox title="Requirements">
        <NameValueTable
          rows={
            status.requirements
              ? [
                  {
                    name: 'Terraform Version',
                    value: status.requirements.terraform?.required_version || '-',
                  },
                  ...(status.requirements.required_providers
                    ? Object.entries(status.requirements.required_providers).map(([prov, ver]) => ({
                        name: `Provider: ${prov}`,
                        value: String(ver),
                      }))
                    : []),
                ]
              : [{ name: 'No requirements', value: '-' }]
          }
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable resource={item.jsonData} />
      </SectionBox>
    </Box>
  );
}

function ModuleCreateForm() {
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  // Fetch namespaces using Headlamp API
  const [namespaces, nsError] = Namespace.useList();
  const [type, setType] = useState('git');
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const typeOptions = [
    { value: 'git', label: 'Git' },
    { value: 'http', label: 'HTTP' },
  ];

  const apiVersion = 'astrolabe.io/v1';
  const kind = 'Module';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await AstrolabeModule.create({
        apiVersion,
        kind,
        metadata: {
          name,
          namespace,
        },
        spec: {
          source: {
            type,
            url,
            version,
          },
        },
      });
      setSuccess('Module created successfully!');
      setName('');
      setNamespace('default');
      setType('git');
      setUrl('');
      setVersion('');
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
          <form onSubmit={handleSubmit} autoComplete="off">
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
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.5, fontWeight: 600, borderRadius: 2, boxShadow: 2 }}
                  startIcon={loading ? <CircularProgress size={22} color="inherit" /> : null}
                >
                  {loading ? 'Creating...' : 'Create Module'}
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
          </form>
        </CardContent>
      </Card>
    </SectionBox>
  );
}

export { AstrolabeModule, ModuleListView, ModuleDetailsView, ModuleCreateForm };
