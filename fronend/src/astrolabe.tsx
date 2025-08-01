import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/K8s/crd';

const astrolabeGroup = 'astrolabe.io';
const astrolabeVersion = 'v1';

const AstrolabeModule = makeCustomResourceClass({
  apiInfo: [{ group: astrolabeGroup, version: astrolabeVersion }],
  isNamespaced: true,
  singularName: 'Module',
  pluralName: 'modules',
});

function AstrolabeModuleListView() {
  return 'Hello Astrolabe!';
}

export { AstrolabeModule, AstrolabeModuleListView };
