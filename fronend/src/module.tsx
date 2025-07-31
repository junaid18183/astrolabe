import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/K8s/crd';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import {
  ConditionsTable,
  Link,
  Loader,
  MainInfoSection,
  NameValueTable,
  ResourceListView,
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
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-900 border rounded shadow">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Namespace</th>
            <th className="px-4 py-2 text-left">Source Type</th>
            <th className="px-4 py-2 text-left">Source URL</th>
            <th className="px-4 py-2 text-left">Version</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Last Synced</th>
            <th className="px-4 py-2 text-left">Cluster</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((module: KubeObjectInterface, index: number) => {
            const { spec = {}, status = {}, metadata = {} } = module.jsonData || {};
            const name = module.getName ? module.getName() : metadata?.name || '-';
            const namespace = module.getNamespace
              ? module.getNamespace()
              : metadata?.namespace || '-';
            const clusterName = module._clusterName || '-';
            const linkPath =
              name !== '-' && namespace !== '-' && clusterName !== '-'
                ? `/c/${clusterName}/astrolabe/modules/${namespace}/${name}`
                : undefined;
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
                <td className="px-4 py-2">{spec.source?.type || '-'}</td>
                <td className="px-4 py-2">{spec.source?.url || '-'}</td>
                <td className="px-4 py-2">{spec.source?.version || '-'}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center">
                    <span
                      className={`h-3 w-3 rounded-full mr-2 ${
                        status.conditions &&
                        status.conditions.some(
                          (c: any) => c.type === 'Ready' && c.status === 'True'
                        )
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                    ></span>
                    {status.conditions &&
                    status.conditions.some((c: any) => c.type === 'Ready' && c.status === 'True')
                      ? 'Ready'
                      : 'Not Ready'}
                  </span>
                </td>
                <td className="px-4 py-2">{status.lastSynced || '-'}</td>
                <td className="px-4 py-2">{module._clusterName}</td>
                <td className="px-4 py-2">
                  {/* Actions placeholder */}
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
        <NameValueTable
          rows={
            Array.isArray(status.providers) && status.providers.length > 0
              ? status.providers.map((p: any) => ({
                  name: p.name,
                  value: `${p.source || '-'}${p.version ? ' @ ' + p.version : ''}`,
                }))
              : [{ name: 'No providers', value: '-' }]
          }
        />
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
        <NameValueTable
          rows={
            Array.isArray(status.outputs) && status.outputs.length > 0
              ? status.outputs.map((output: any) => ({
                  name: output.name,
                  value: `${output.type}${output.sensitive ? ' (sensitive)' : ''}${
                    output.description ? ' - ' + output.description : ''
                  }`,
                }))
              : [{ name: 'No outputs', value: '-' }]
          }
        />
      </SectionBox>

      <SectionBox title="Resources">
        <NameValueTable
          rows={
            Array.isArray(status.resources) && status.resources.length > 0
              ? status.resources.map((r: any) => ({ name: r.name, value: r.type }))
              : [{ name: 'No resources', value: '-' }]
          }
        />
      </SectionBox>

      <SectionBox title="Submodules">
        <NameValueTable
          rows={
            Array.isArray(status.submodules) && status.submodules.length > 0
              ? status.submodules.map((s: any) => ({ name: s.name, value: s.source }))
              : [{ name: 'No submodules', value: '-' }]
          }
        />
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

export { AstrolabeModule, ModuleListView, ModuleDetailsView };
