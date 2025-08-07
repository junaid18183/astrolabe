import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import ModuleCreateForm from './module-create';
import ModuleDetailsView from './module-details';
import ModuleListView from './module-list';
import { AstrolabeModuleListView } from './astrolabe';
import StackDetailsView from './stack-details';
import StackListView from './stack-list';
import StackCreateForm from './stack-create';

// Register sidebar and routes
const sidebarEntries = [
  {
    parent: null,
    name: 'astrolabe',
    label: 'Astrolabe',
    icon: 'mdi:cow',
    url: '/astrolabe',
  },
  {
    parent: 'astrolabe',
    name: 'modules',
    label: 'Modules',
    url: '/astrolabe/modules',
  },
  {
    parent: 'astrolabe',
    name: 'stacks',
    label: 'Stacks',
    url: '/astrolabe/stacks',
  },
];

const routes = [
  {
    path: '/astrolabe',
    sidebar: 'astrolabe',
    name: 'astrolabe',
    exact: true,
    component: AstrolabeModuleListView,
  },
  {
    path: '/astrolabe/modules',
    sidebar: 'modules',
    name: 'modules',
    exact: true,
    component: ModuleListView,
  },
  {
    path: '/astrolabe/create-module',
    sidebar: 'modules',
    name: 'create-modules',
    exact: true,
    component: ModuleCreateForm,
  },
  {
    path: '/astrolabe/modules/:namespace/:name',
    sidebar: 'modules',
    parent: 'astrolabe/module',
    name: 'module',
    exact: true,
    component: ModuleDetailsView,
  },
  {
    path: '/astrolabe/stacks',
    sidebar: 'stacks',
    name: 'stacks',
    exact: true,
    component: StackListView,
  },
  {
    path: '/astrolabe/stacks/:namespace/:name',
    sidebar: 'stacks',
    parent: 'astrolabe/stacks',
    name: 'stack',
    exact: true,
    component: StackDetailsView,
  },
  {
    path: '/astrolabe/create-stack',
    sidebar: 'stacks',
    parent: 'astrolabe/stacks',
    name: 'create-stack',
    exact: true,
    component: StackCreateForm,
  },
];

// Registering all sidebar entries
sidebarEntries.forEach(entry => registerSidebarEntry(entry));

// Registering all routes
routes.forEach(route => registerRoute(route));

console.log('Astrolabe Plugin registered.');
