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
      accessorFn: (stack: KubeObjectInterface) => {
        const { metadata = {} } = stack.jsonData || {};
        const name = stack.getName ? stack.getName() : metadata?.name || '-';
        const namespace = stack.getNamespace ? stack.getNamespace() : metadata?.namespace || '-';
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
      accessorFn: (stack: KubeObjectInterface) =>
        stack.getNamespace ? stack.getNamespace() : stack.jsonData?.metadata?.namespace || '-',
    },
    {
      header: 'Status',
      accessorFn: (stack: KubeObjectInterface) => stack.jsonData?.status?.status || '-',
    },
    {
      header: 'Last Synced',
      accessorFn: (stack: KubeObjectInterface) => stack.jsonData?.status?.lastSynced || '-',
    },
    {
      header: 'Actions',
      accessorFn: (stack: KubeObjectInterface) => {
        const { metadata = {} } = stack.jsonData || {};
        const name = stack.getName ? stack.getName() : metadata?.name || '-';
        const namespace = stack.getNamespace ? stack.getNamespace() : metadata?.namespace || '-';
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
          <ActionButton
            key="create-stack"
            description="Create stacks"
            icon="mdi:plus"
            onClick={() => {
              const clusterName = stacks?.[0]?._clusterName || '-';
              window.location.href = `/c/${clusterName}/astrolabe/create-stack`;
            }}
          />,
        ],
      }}
    >
      <Table columns={columns} data={stacks} />
    </SectionBox>
  );
}

export default StackListView;
