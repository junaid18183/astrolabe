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
              const linkPath =
                name !== '-' && namespace !== '-' && clusterName !== '-'
                  ? `/c/${clusterName}/astrolabe/modules/${namespace}/${name}`
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
              const linkPath =
                name !== '-' && namespace !== '-' && clusterName !== '-'
                  ? `/c/${clusterName}/astrolabe/modules/${namespace}/${name}`
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

export { AstrolabeModule, ModuleListView, ModuleDetailsView };
