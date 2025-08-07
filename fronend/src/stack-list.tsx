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
        const clusterName = stack._clusterName || '-';
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
          <StatusLabel status={ready ? 'success' : 'warning'}>
            {ready ? 'Ready' : 'Not Ready'}
          </StatusLabel>
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
        const namespace = stack.getNamespace ? stack.getNamespace() : metadata?.namespace || '-';
        const clusterName = stack._clusterName || '-';
        return name !== '-' && namespace !== '-' ? (
          <Link routeName="stacks" params={{ namespace, name }} tooltip="View stack">
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
