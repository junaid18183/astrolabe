import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { AstrolabeModule } from './astrolabe';
import {
  SectionBox,
  Table,
  Link,
  Loader,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

function ModuleListView() {
  const [modules, error] = AstrolabeModule.useList();

  if (error) {
    return <div>Error loading modules: {(error as Error).message}</div>;
  }

  if (!modules) {
    return <Loader />;
  }

  const getColumnData = (module: KubeObjectInterface, key: string, fallback: string = '-') => {
    return module.jsonData?.[key] || fallback;
  };

  const renderLinkOrName = (
    module: KubeObjectInterface,
    clusterName: string,
    name: string,
    namespace: string
  ) =>
    name !== '-' && namespace !== '-' ? (
      <Link routeName="module" params={{ namespace, name }} tooltip={name}>
        {name}
      </Link>
    ) : (
      <span>{name}</span>
    );

  const columns = [
    {
      header: 'Name',
      accessorFn: (module: KubeObjectInterface) => {
        const metadata = getColumnData(module, 'metadata', {});
        const name = module.getName ? module.getName() : metadata.name || '-';
        const namespace = module.getNamespace ? module.getNamespace() : metadata.namespace || '-';
        const clusterName = module._clusterName || '-';
        return renderLinkOrName(module, clusterName, name, namespace);
      },
    },
    {
      header: 'Namespace',
      accessorFn: (module: KubeObjectInterface) =>
        module.getNamespace ? module.getNamespace() : getColumnData(module, 'metadata.namespace'),
    },
    {
      header: 'Source Type',
      accessorFn: (module: KubeObjectInterface) => getColumnData(module, 'spec.source.type'),
    },
    {
      header: 'Source URL',
      accessorFn: (module: KubeObjectInterface) => getColumnData(module, 'spec.source.url'),
    },
    {
      header: 'Version',
      accessorFn: (module: KubeObjectInterface) => getColumnData(module, 'spec.source.version'),
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
      accessorFn: (module: KubeObjectInterface) => getColumnData(module, 'status.lastSynced'),
    },
    {
      header: 'Cluster',
      accessorFn: (module: KubeObjectInterface) => module._clusterName || '-',
    },
    {
      header: 'Actions',
      accessorFn: (module: KubeObjectInterface) => {
        const metadata = getColumnData(module, 'metadata', {});
        const name = module.getName ? module.getName() : metadata.name || '-';
        const namespace = module.getNamespace ? module.getNamespace() : metadata.namespace || '-';
        const clusterName = module._clusterName || '-';
        return name !== '-' && namespace !== '-' ? (
          <Link routeName="module" params={{ namespace, name }} tooltip="View module">
            <span className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">View</span>
          </Link>
        ) : (
          <span>-</span>
        );
      },
    },
  ];

  return (
    <SectionBox title="Modules">
      <Table columns={columns} data={modules} />
    </SectionBox>
  );
}

export default ModuleListView;
