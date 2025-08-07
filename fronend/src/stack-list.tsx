import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { AstrolabeStack } from './astrolabe';
import {
  SectionBox,
  Table,
  Link,
  Loader,
  StatusLabel,
  ActionButton,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

function StackListView() {
  const [stacks, error] = AstrolabeStack.useList();

  if (error) {
    // @ts-ignore Error type is not well defined
    return <div>Error loading stacks: {(error as Error).message}</div>;
  }
  if (!stacks) {
    return <Loader />;
  }

  const columns = [
    {
      header: 'Name',
      accessor: 'metadata.name',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) => {
        const stack = row.original;
        const name = stack.getName ? stack.getName() : stack.jsonData?.metadata?.name || '-';
        const namespace = stack.getNamespace
          ? stack.getNamespace()
          : stack.jsonData?.metadata?.namespace || '-';
        return name !== '-' && namespace !== '-' ? (
          <Link routeName="stack" params={{ namespace, name }} tooltip={name}>
            {name}
          </Link>
        ) : (
          <span>{name}</span>
        );
      },
    },
    {
      header: 'Namespace',
      accessor: 'metadata.namespace',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) =>
        row.original.getNamespace
          ? row.original.getNamespace()
          : row.original.jsonData?.metadata?.namespace || '-',
    },
    {
      header: 'Phase',
      accessor: 'status.phase',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) =>
        row.original.jsonData?.status?.phase || '-',
    },
    {
      header: 'Applied',
      accessor: 'status.applied',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) =>
        row.original.jsonData?.status?.applied || '-',
    },
    {
      header: 'Status',
      accessor: 'status.status',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) => {
        const status = row.original.jsonData?.status?.status || '-';
        return <StatusLabel status={status} />;
      },
    },
    {
      header: 'Ready',
      accessor: 'status.ready',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) => {
        const ready = row.original.jsonData?.status?.ready;
        if (ready === true) return <span className="text-green-600">true</span>;
        if (ready === false) return <span className="text-red-600">false</span>;
        return '-';
      },
    },
    {
      header: 'Summary',
      accessor: 'status.summary',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) =>
        row.original.jsonData?.status?.summary || '-',
    },
    {
      header: 'Last Synced',
      accessor: 'status.lastSynced',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) =>
        row.original.jsonData?.status?.lastSynced || '-',
    },
    {
      header: 'Actions',
      id: 'actions',
      Cell: ({ row }: { row: { original: KubeObjectInterface } }) => {
        const stack = row.original;
        const name = stack.getName ? stack.getName() : stack.jsonData?.metadata?.name || '-';
        const namespace = stack.getNamespace
          ? stack.getNamespace()
          : stack.jsonData?.metadata?.namespace || '-';
        return name !== '-' && namespace !== '-' ? (
          <Link routeName="stack" params={{ namespace, name }} tooltip="View stack">
            <span className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">View</span>
          </Link>
        ) : (
          <span>-</span>
        );
      },
    },
  ];

  return (
    <SectionBox
      title="Stacks"
      description="List of Astrolabe stacks"
      headerProps={{
        titleSideActions: [
          <Link
            key="create-stack"
            routeName="create-stack"
            params={{
              cluster: stacks?.[0]?._clusterName || '-',
            }}
            tooltip="Create stacks"
          >
            <span className="flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
              <span className="mdi mdi-plus mr-1" />
              Create
            </span>
          </Link>,
        ],
      }}
    >
      <Table columns={columns} data={stacks} />
    </SectionBox>
  );
}

export default StackListView;
