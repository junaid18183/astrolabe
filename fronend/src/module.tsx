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
function ModuleListView() {
  const [modules, error] = AstrolabeModule.useList();

  if (error) {
    // @ts-ignore Error type is not well defined
    return <div>Error loading modules: {(error as Error).message}</div>;
  }
  if (!modules) {
    return <Loader />;
  }

  return (
    <div>
      {modules.map((module: KubeObjectInterface, index: number) => {
        const { spec = {}, status = {}, metadata = {} } = module.jsonData || {};
        return (
          <div key={index} className="mb-4 p-4 border rounded shadow-sm">
            <p>
              <strong>Name:</strong> {module.getName()}
            </p>
            <p>
              <strong>Namespace:</strong> {module.getNamespace()}
            </p>
            <p>
              <strong>Source Type:</strong> {spec.source?.type || '-'}
            </p>
            <p>
              <strong>Source URL:</strong> {spec.source?.url || '-'}
            </p>
            <p>
              <strong>Source Path:</strong> {spec.source?.path || '-'}
            </p>
            <p>
              <strong>Version:</strong> {spec.source?.version || '-'}
            </p>
            <p>
              <strong>Description:</strong> {status.description || '-'}
            </p>
            <p>
              <strong>Last Synced:</strong> {status.lastSynced || '-'}
            </p>
            <p>
              <strong>Cluster Name:</strong> {module._clusterName}
            </p>
            <div>
              <strong>Providers:</strong>
              <ul>
                {(status.providers ?? []).length > 0 ? (
                  status.providers.map((p: any, i: number) => (
                    <li key={i}>
                      {p.name} ({p.source || '-'}) {p.version ? '@ ' + p.version : ''}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Inputs:</strong>
              <ul>
                {(status.inputs ?? []).length > 0 ? (
                  status.inputs.map((input: any, i: number) => (
                    <li key={i}>
                      {input.name}: {input.type}
                      {input.required ? ' (required)' : ''}
                      {input.sensitive ? ' (sensitive)' : ''}
                      {input.default !== undefined ? ' (default: ' + input.default + ')' : ''}{' '}
                      {input.description ? '- ' + input.description : ''}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Outputs:</strong>
              <ul>
                {(status.outputs ?? []).length > 0 ? (
                  status.outputs.map((output: any, i: number) => (
                    <li key={i}>
                      {output.name}: {output.type}
                      {output.sensitive ? ' (sensitive)' : ''}
                      {output.description ? ' - ' + output.description : ''}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Resources:</strong>
              <ul>
                {(status.resources ?? []).length > 0 ? (
                  status.resources.map((r: any, i: number) => (
                    <li key={i}>
                      {r.name}: {r.type}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Submodules:</strong>
              <ul>
                {(status.submodules ?? []).length > 0 ? (
                  status.submodules.map((s: any, i: number) => (
                    <li key={i}>
                      {s.name}: {s.source}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Requirements:</strong>
              <ul>
                {status.requirements ? (
                  <>
                    <li>
                      Terraform Version: {status.requirements.terraform?.required_version || '-'}
                    </li>
                    {status.requirements.required_providers &&
                      Object.entries(status.requirements.required_providers).map(
                        ([prov, ver], i) => (
                          <li key={i}>
                            Provider: {prov} - {String(ver)}
                          </li>
                        )
                      )}
                  </>
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Conditions:</strong>
              <ul>
                {(status.conditions ?? []).length > 0 ? (
                  status.conditions.map((cond: any, i: number) => (
                    <li key={i}>
                      {cond.type}: {cond.status} ({cond.reason}){' '}
                      {cond.message ? '- ' + cond.message : ''}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModuleDetailsView() {
  const [modules, error] = AstrolabeModule.useList();

  if (error) {
    // @ts-ignore Error type is not well defined
    return <div>Error loading modules: {(error as Error).message}</div>;
  }
  if (!modules) {
    return <Loader />;
  }

  return (
    <div>
      {modules.map((module: KubeObjectInterface, index: number) => {
        const { spec = {}, status = {}, metadata = {} } = module.jsonData || {};
        return (
          <div key={index} className="mb-4 p-4 border rounded shadow-sm">
            <p>
              <strong>Name:</strong> {module.getName()}
            </p>
            <p>
              <strong>Namespace:</strong> {module.getNamespace()}
            </p>
            <p>
              <strong>Source Type:</strong> {spec.source?.type || '-'}
            </p>
            <p>
              <strong>Source URL:</strong> {spec.source?.url || '-'}
            </p>
            <p>
              <strong>Source Path:</strong> {spec.source?.path || '-'}
            </p>
            <p>
              <strong>Version:</strong> {spec.source?.version || '-'}
            </p>
            <p>
              <strong>Description:</strong> {status.description || '-'}
            </p>
            <p>
              <strong>Last Synced:</strong> {status.lastSynced || '-'}
            </p>
            <p>
              <strong>Cluster Name:</strong> {module._clusterName}
            </p>
            <div>
              <strong>Providers:</strong>
              <ul>
                {(status.providers ?? []).length > 0 ? (
                  status.providers.map((p: any, i: number) => (
                    <li key={i}>
                      {p.name} ({p.source || '-'}) {p.version ? '@ ' + p.version : ''}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Inputs:</strong>
              <ul>
                {(status.inputs ?? []).length > 0 ? (
                  status.inputs.map((input: any, i: number) => (
                    <li key={i}>
                      {input.name}: {input.type}
                      {input.required ? ' (required)' : ''}
                      {input.sensitive ? ' (sensitive)' : ''}
                      {input.default !== undefined ? ' (default: ' + input.default + ')' : ''}{' '}
                      {input.description ? '- ' + input.description : ''}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Outputs:</strong>
              <ul>
                {(status.outputs ?? []).length > 0 ? (
                  status.outputs.map((output: any, i: number) => (
                    <li key={i}>
                      {output.name}: {output.type}
                      {output.sensitive ? ' (sensitive)' : ''}
                      {output.description ? ' - ' + output.description : ''}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Resources:</strong>
              <ul>
                {(status.resources ?? []).length > 0 ? (
                  status.resources.map((r: any, i: number) => (
                    <li key={i}>
                      {r.name}: {r.type}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Submodules:</strong>
              <ul>
                {(status.submodules ?? []).length > 0 ? (
                  status.submodules.map((s: any, i: number) => (
                    <li key={i}>
                      {s.name}: {s.source}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Requirements:</strong>
              <ul>
                {status.requirements ? (
                  <>
                    <li>
                      Terraform Version: {status.requirements.terraform?.required_version || '-'}
                    </li>
                    {status.requirements.required_providers &&
                      Object.entries(status.requirements.required_providers).map(
                        ([prov, ver], i) => (
                          <li key={i}>
                            Provider: {prov} - {String(ver)}
                          </li>
                        )
                      )}
                  </>
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
            <div>
              <strong>Conditions:</strong>
              <ul>
                {(status.conditions ?? []).length > 0 ? (
                  status.conditions.map((cond: any, i: number) => (
                    <li key={i}>
                      {cond.type}: {cond.status} ({cond.reason}){' '}
                      {cond.message ? '- ' + cond.message : ''}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { AstrolabeModule, ModuleListView, ModuleDetailsView };
