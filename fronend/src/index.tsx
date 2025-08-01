import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import ModuleCreateForm from './module-create';
import ModuleDetailsView from './module-details';
import ModuleListView from './module-list';
import { AstrolabeModuleListView } from './astrolabe';
import { StackDetailsView, StackListView } from './stack';

// Register Root Sidebar Entries
registerSidebarEntry({
  parent: null, // Top-level entry
  name: 'astrolabe',
  label: 'Astrolabe',
  icon: 'mdi:cow',
  url: '/astrolabe',
});

// Register Modules Sidebar Entry
registerSidebarEntry({
  parent: 'astrolabe',
  name: 'modules',
  label: 'Modules',
  url: '/astrolabe/modules',
});

registerSidebarEntry({
  parent: 'astrolabe',
  name: 'modules-create',
  label: 'CreateModules',
  url: '/astrolabe/create-modules',
});

// Register Stacks Sidebar Entry
registerSidebarEntry({
  parent: 'astrolabe',
  name: 'stacks',
  label: 'Stacks',
  url: '/astrolabe/stacks',
});

// Root Route for Astrolabe
registerRoute({
  path: '/astrolabe',
  sidebar: 'astrolabe',
  name: 'astrolabe',
  exact: true,
  component: AstrolabeModuleListView,
});

// Module List View
registerRoute({
  path: '/astrolabe/modules',
  sidebar: 'modules',
  name: 'modules',
  exact: true,
  component: ModuleListView,
});

// Module Create  View
registerRoute({
  path: '/astrolabe/create-modules',
  sidebar: 'modules',
  name: 'create-modules',
  exact: true,
  component: ModuleCreateForm,
});

// Module Detail View
registerRoute({
  path: '/astrolabe/modules/:namespace/:name',
  sidebar: 'modules',
  parent: 'astrolabe/modules',
  name: 'module',
  exact: true,
  component: ModuleDetailsView,
});

// Stacks List View
registerRoute({
  path: '/astrolabe/stacks',
  sidebar: 'stacks',
  name: 'stacks',
  exact: true,
  component: StackListView,
});

// Stack Detail View
registerRoute({
  path: '/astrolabe/stacks/:namespace/:name',
  sidebar: 'stacks',
  parent: 'astrolabe/stacks',
  name: 'stack',
  exact: true,
  component: StackDetailsView,
});



console.log('Astrolabe Plugin registered.');
