import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { ModuleListView, ModuleDetailsView, AstrolabeModule } from './module';
import { StackDetailsView, StackListView } from './stack';

const ASTROLABE_ROOT_SIDEBAR = 'astrolabe';
const ASTROLABE_MODULES_LIST_ROUTE = 'modules';
const ASTROLABE_MODULE_DETAILS_ROUTE = 'module';
const ASTROLABE_STACKS_LIST_ROUTE = 'stacks';

// Register Root Sidebar Entries
registerSidebarEntry({
  parent: null, // Top-level entry
  name: ASTROLABE_ROOT_SIDEBAR,
  label: 'Astrolabe',
  icon: 'mdi:cow',
  url: '/astrolabe',
});

// Register Modules Sidebar Entry
registerSidebarEntry({
  parent: ASTROLABE_ROOT_SIDEBAR,
  name: ASTROLABE_MODULES_LIST_ROUTE,
  label: 'Modules',
  url: '/astrolabe/modules',
});

// Register Stacks Sidebar Entry
registerSidebarEntry({
  parent: ASTROLABE_ROOT_SIDEBAR,
  name: ASTROLABE_STACKS_LIST_ROUTE,
  label: 'Stacks',
  url: '/astrolabe/stacks',
});

// Stacks List View
registerRoute({
  path: '/astrolabe/stacks',
  sidebar: ASTROLABE_STACKS_LIST_ROUTE,
  name: ASTROLABE_STACKS_LIST_ROUTE,
  exact: true,
  component: StackListView,
});

// Stack Detail View
registerRoute({
  path: '/astrolabe/stacks/:namespace/:name',
  sidebar: ASTROLABE_STACKS_LIST_ROUTE,
  parent: ASTROLABE_ROOT_SIDEBAR,
  name: ASTROLABE_STACKS_LIST_ROUTE,
  exact: true,
  component: StackDetailsView,
});

registerRoute({
  path: '/astrolabe',
  sidebar: ASTROLABE_MODULES_LIST_ROUTE,
  name: ASTROLABE_MODULES_LIST_ROUTE,
  exact: true,
  component: AstrolabeModuleListView,
});

// Module List View
registerRoute({
  path: '/astrolabe/modules',
  sidebar: ASTROLABE_MODULES_LIST_ROUTE,
  name: ASTROLABE_MODULES_LIST_ROUTE,
  exact: true,
  component: ModuleListView,
});

// Module Detail View
registerRoute({
  path: '/astrolabe/modules/:namespace/:name',
  sidebar: ASTROLABE_MODULES_LIST_ROUTE,
  parent: ASTROLABE_ROOT_SIDEBAR,
  name: ASTROLABE_MODULE_DETAILS_ROUTE,
  exact: true,
  component: ModuleDetailsView,
});

function AstrolabeModuleListView() {
  return 'Hello Astrolabe!';
}

console.log('Astrolabe Plugin registered.');
