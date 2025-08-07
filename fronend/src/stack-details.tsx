import { useParams } from 'react-router-dom';
import { AstrolabeStack } from './astrolabe';
import { Box } from '@mui/material';
import {
  ConditionsTable,
  MainInfoSection,
  NameValueTable,
  SectionBox,
  Link,
  StatusLabel,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

function StackDetailsView() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [stack, error] = AstrolabeStack.useGet(name, namespace);

  if (error) {
    return <div>Error loading stack: {(error as Error).message}</div>;
  }

  if (!stack) {
    return <div>Loading...</div>;
  }

  const { spec = {}, status = {}, metadata = {} } = stack.jsonData || {};

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
        resource={stack}
        title={`Stack: ${metadata.name}`}
        extraInfo={[
          { name: 'Phase', value: status.phase || '-' },
          { name: 'Status', value: status.status || '-' },
          { name: 'Ready', value: status.ready !== undefined ? String(status.ready) : '-' },
          { name: 'Summary', value: status.summary || '-' },
        ]}
      />

      <SectionBox title="Backend Config">
        <NameValueTable
          rows={
            spec.backendConfig
              ? [
                  { name: 'Type', value: spec.backendConfig.type || '-' },
                  { name: 'Settings', value: JSON.stringify(spec.backendConfig.settings) || '-' },
                ]
              : [{ name: 'No backend config', value: '-' }]
          }
        />
      </SectionBox>

      <SectionBox title="Credential Reference">
        <NameValueTable
          rows={
            spec.credentialRef
              ? [{ name: 'Name', value: spec.credentialRef.name || '-' }]
              : [{ name: 'No credential reference', value: '-' }]
          }
        />
      </SectionBox>

      <SectionBox title="Modules">
        <Table
          columns={[
            {
              header: 'Name',
              accessorFn: (m: any) => m.name || '-',
            },
            {
              header: 'Depends On',
              accessorFn: (m: any) => (Array.isArray(m.dependsOn) ? m.dependsOn.join(', ') : '-'),
            },
            {
              header: 'Variables',
              accessorFn: (m: any) => (m.variables ? JSON.stringify(m.variables) : '-'),
            },
          ]}
          data={Array.isArray(spec.modules) ? spec.modules : []}
          emptyMessage="No modules"
        />
      </SectionBox>

      <SectionBox title="Outputs">
        <NameValueTable
          rows={
            status.outputs
              ? Object.entries(status.outputs).map(([key, value]) => ({
                  name: key,
                  value: JSON.stringify(value),
                }))
              : [{ name: 'No outputs', value: '-' }]
          }
        />
      </SectionBox>

      <SectionBox title="Resources">
        <NameValueTable
          rows={
            Array.isArray(status.resources) && status.resources.length > 0
              ? status.resources.map((r: any) => ({ name: r.name, value: '-' }))
              : [{ name: 'No resources', value: '-' }]
          }
        />
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable resource={stack.jsonData} />
      </SectionBox>
    </Box>
  );
}

export default StackDetailsView;
