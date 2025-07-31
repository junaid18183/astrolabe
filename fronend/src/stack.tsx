import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/K8s/crd';
import { useParams } from 'react-router-dom';
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import {
  ConditionsTable,
  MainInfoSection,
  NameValueTable,
  SectionBox,
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
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-900 border rounded shadow">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Namespace</th>
            <th className="px-4 py-2 text-left">Phase</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Ready</th>
            <th className="px-4 py-2 text-left">Age</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stacks.map((stack: KubeObjectInterface, index: number) => {
            const { spec = {}, status = {}, metadata = {} } = stack.jsonData || {};
            const name = stack.getName ? stack.getName() : metadata?.name || '-';
            const namespace = stack.getNamespace
              ? stack.getNamespace()
              : metadata?.namespace || '-';
            const clusterName = stack._clusterName || '-';
            const linkPath =
              name !== '-' && namespace !== '-' && clusterName !== '-'
                ? `/c/${clusterName}/astrolabe/stacks/${namespace}/${name}`
                : undefined;
            // Age calculation
            let age = '-';
            if (metadata.creationTimestamp) {
              const created = new Date(metadata.creationTimestamp);
              const now = new Date();
              const diffMs = now.getTime() - created.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              age = diffDays > 0 ? `${diffDays}d` : `${Math.floor(diffMs / (1000 * 60 * 60))}h`;
            }
            return (
              <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-2">
                  {linkPath ? (
                    <a href={linkPath} className="text-blue-600 hover:underline">
                      {name}
                    </a>
                  ) : (
                    <span>{name}</span>
                  )}
                </td>
                <td className="px-4 py-2">{namespace}</td>
                <td className="px-4 py-2">{status.phase || '-'}</td>
                <td className="px-4 py-2">{status.status || '-'}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center">
                    <span
                      className={`h-3 w-3 rounded-full mr-2 ${
                        status.ready === true ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></span>
                    {status.ready === true ? 'Ready' : 'Not Ready'}
                  </span>
                </td>
                <td className="px-4 py-2">{age}</td>
                <td className="px-4 py-2">
                  {linkPath ? (
                    <a
                      href={linkPath}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View
                    </a>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Depends On</TableCell>
                <TableCell>Variables</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(spec.modules) && spec.modules.length > 0 ? (
                spec.modules.map((m: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>
                      {Array.isArray(m.dependsOn) ? m.dependsOn.join(', ') : '-'}
                    </TableCell>
                    <TableCell>{m.variables ? JSON.stringify(m.variables) : '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3}>No modules</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
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
