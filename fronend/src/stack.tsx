import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/K8s/crd';
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
function StackListView() {
  return (
    "Hello Headlamp!"
  );
}

// Define Detail View Wrapper Components
function StackDetailsView() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [item, error] = AstrolabeModule.useGet(name, namespace);

  if (error) {
    // @ts-ignore Error type is not well defined
    return <div>Error loading module: {(error as Error).message}</div>;
  }
  if (!item) {
    return <div>Loading...</div>;
  }

  // Restore original rendering
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
          { name: 'Source Type', value: spec.source?.type || '-' },
          { name: 'Source URL', value: spec.source?.url || '-' },
          { name: 'Version', value: spec.source?.version || '-' },
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
        <NameValueTable
          rows={
            Array.isArray(status.inputs) && status.inputs.length > 0
              ? status.inputs.map((input: any) => ({
                name: input.name,
                value: `${input.type}${input.required ? ' (required)' : ''}${input.sensitive ? ' (sensitive)' : ''
                  }${input.default !== undefined ? ' (default: ' + input.default + ')' : ''}`,
              }))
              : [{ name: 'No inputs', value: '-' }]
          }
        />
      </SectionBox>
      <SectionBox title="Outputs">
        <NameValueTable
          rows={
            Array.isArray(status.outputs) && status.outputs.length > 0
              ? status.outputs.map((output: any) => ({
                name: output.name,
                value: `${output.type}${output.sensitive ? ' (sensitive)' : ''}${output.description ? ' - ' + output.description : ''
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
              ? status.resources.map((r: any) => ({
                name: r.name,
                value: r.type,
              }))
              : [{ name: 'No resources', value: '-' }]
          }
        />
      </SectionBox>
      <SectionBox title="Submodules">
        <NameValueTable
          rows={
            Array.isArray(status.submodules) && status.submodules.length > 0
              ? status.submodules.map((s: any) => ({
                name: s.name,
                value: s.source,
              }))
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
                ...Object.entries(status.requirements.required_providers || {}).map(
                  ([prov, ver]) => ({ name: `Provider: ${prov}`, value: ver })
                ),
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

export {
  AstrolabeModule,
  StackListView,
  StackDetailsView,
};
