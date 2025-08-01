import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import React from 'react';
import { AstrolabeModule } from './astrolabe';
import {
  MainInfoSection,
  SectionBox,
  Table,
  NameValueTable,
  ConditionsTable,
  Loader,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

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

export default ModuleDetailsView;
