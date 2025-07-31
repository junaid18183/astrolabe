import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/K8s/crd';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import {
  ConditionsTable,
  MainInfoSection,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

// Define constants for Astrolabe Resource Classes
const astrolabeGroup = 'astrolabe.io';
const astrolabeVersion = 'v1';

const AstrolabeStack = makeCustomResourceClass({
  apiInfo: [{ group: astrolabeGroup, version: astrolabeVersion }],
  isNamespaced: true,
  singularName: 'Stack',
  pluralName: 'stacks',
});

// Define Stack List View Component
function StackListView() {
  const [stacks, error] = AstrolabeStack.useList();

  if (error) {
    // @ts-ignore Error type is not well defined
    return <div>Error loading stacks: {(error as Error).message}</div>;
  }
  if (!stacks) {
    return <div>Loading...</div>;
  }

  return (
    <SectionBox title="Stacks">
      <Table
        columns={[
          {
            header: 'Name',
            accessorFn: (stack: KubeObjectInterface) => {
              const { metadata = {} } = stack.jsonData || {};
              const name = stack.getName ? stack.getName() : metadata?.name || '-';
              const namespace = stack.getNamespace
                ? stack.getNamespace()
                : metadata?.namespace || '-';
              const clusterName = stack._clusterName || '-';
              const linkPath =
                name !== '-' && namespace !== '-' && clusterName !== '-'
                  ? `/c/${clusterName}/astrolabe/stacks/${namespace}/${name}`
                  : undefined;
              return linkPath ? (
                <a href={linkPath} className="text-blue-600 hover:underline">
                  {name}
                </a>
              ) : (
                <span>{name}</span>
              );
            },
          },
          {
            header: 'Namespace',
            accessorFn: (stack: KubeObjectInterface) =>
              stack.getNamespace
                ? stack.getNamespace()
                : stack.jsonData?.metadata?.namespace || '-',
          },
          {
            header: 'Phase',
            accessorFn: (stack: KubeObjectInterface) => stack.jsonData?.status?.phase || '-',
          },
          {
            header: 'Status',
            accessorFn: (stack: KubeObjectInterface) => stack.jsonData?.status?.status || '-',
          },
          {
            header: 'Ready',
            accessorFn: (stack: KubeObjectInterface) => {
              const ready = stack.jsonData?.status?.ready === true;
              return (
                <span className="inline-flex items-center">
                  <span
                    className={`h-3 w-3 rounded-full mr-2 ${
                      ready ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></span>
                  {ready ? 'Ready' : 'Not Ready'}
                </span>
              );
            },
          },
          {
            header: 'Age',
            accessorFn: (stack: KubeObjectInterface) => {
              const metadata = stack.jsonData?.metadata || {};
              let age = '-';
              if (metadata.creationTimestamp) {
                const created = new Date(metadata.creationTimestamp);
                const now = new Date();
                const diffMs = now.getTime() - created.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                age = diffDays > 0 ? `${diffDays}d` : `${Math.floor(diffMs / (1000 * 60 * 60))}h`;
              }
              return age;
            },
          },
          {
            header: 'Actions',
            accessorFn: (stack: KubeObjectInterface) => {
              const { metadata = {} } = stack.jsonData || {};
              const name = stack.getName ? stack.getName() : metadata?.name || '-';
              const namespace = stack.getNamespace
                ? stack.getNamespace()
                : metadata?.namespace || '-';
              const clusterName = stack._clusterName || '-';
              const linkPath =
                name !== '-' && namespace !== '-' && clusterName !== '-'
                  ? `/c/${clusterName}/astrolabe/stacks/${namespace}/${name}`
                  : undefined;
              return linkPath ? (
                <a
                  href={linkPath}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  View
                </a>
              ) : (
                <span>-</span>
              );
            },
          },
        ]}
        data={stacks}
      />
    </SectionBox>
  );
}

// Define Stack Details View Component
function StackDetailsView() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [item, error] = AstrolabeStack.useGet(name, namespace);

  if (error) {
    return <div>Error loading stack: {(error as Error).message}</div>;
  }

  if (!item) {
    return <div>Loading...</div>;
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
        <ConditionsTable resource={item.jsonData} />
      </SectionBox>
    </Box>
  );
}

export { AstrolabeStack, StackListView, StackDetailsView };
