// a HHS space for storing the available wiki spaces and configuring them
//

import {
  ClassRegistry,
  Hash,
  HashedObject,
  IdbBackend,
  MemoryBackendHost,
  Mesh,
  MutableArray,
  Resources,
  Store,
  WebWorkerMeshProxy,
  WorkerSafeIdbBackend,
} from '@hyper-hyper-space/core';
import { WikiSpace } from '@hyper-hyper-space/wiki-collab';

class Launcher extends HashedObject {
  static className = 'hyper-browser-web/Launcher';
  static version = '1.0.0';

  spaces?: MutableArray<WikiSpace>;

  constructor() {
    super();
    this.setId('wiki-launcher');
    this.addDerivedField('spaces', new MutableArray<WikiSpace>());
  }

  getClassName(): string {
    return Launcher.className;
  }

  init(): void {
    // console.log('init launcher')
    // this.setRandomId();
  }

  static backendNameForSpace(space: Hash): string {
    return `wiki-collab-${space}`;
  }

  static backendNameForTransientSpace(space: Hash): string {
    return `wiki-collab-transient-${space}`;
  }

  static async initSpaceStore(
    spaceEntryPoint: HashedObject | Hash,
  ): Promise<Store> {
    const spaceEntryPointHash =
      spaceEntryPoint instanceof HashedObject
        ? spaceEntryPoint.getLastHash()
        : spaceEntryPoint;

    const backend = new WorkerSafeIdbBackend(
      Launcher.backendNameForSpace(spaceEntryPointHash),
    );

    const store = new Store(backend);

    if (spaceEntryPoint instanceof HashedObject) {
      await store.save(spaceEntryPoint);
    }

    return store;
  }

  static async savedSpaceStoreExists(spaceEntryPointHash: Hash) {
    const backendName = Launcher.backendNameForSpace(spaceEntryPointHash);
    return IdbBackend.exists(backendName);
  }

  static async initSpaceMesh(spaceHash: Hash): Promise<Mesh> {
    const worker = new Worker(new URL('./mesh.worker', import.meta.url));

    const webWorkerMesh = new WebWorkerMeshProxy(worker);

    await webWorkerMesh.ready; // The MeshHost in the web worker will send a message once it is fully
    // operational. We don't want to send any control messages before that,
    // so we'll wait here until we get the 'go' message from the MeshHost.

    const mesh = webWorkerMesh.getMesh();

    return mesh;
  }
  
  // async startSync() {
  //   console.log('start sync');
  //   [...this.spaces?.values() || []].forEach((space) => {
  //    space.loadAndWatchForChanges();
  //   }) 
  // }
  
  // async stopSync() {
  //   [...this.spaces?.values() || []].forEach((space) => {
  //    space.loadAndWatchForChanges();
  //   })
  // }

  static async initSpaceResources(
    spaceEntryPoint: HashedObject | Hash,
  ): Promise<Resources> {
    const spaceEntryPointHash =
      spaceEntryPoint instanceof HashedObject
        ? spaceEntryPoint.getLastHash()
        : spaceEntryPoint;

    const mesh = await Launcher.initSpaceMesh(spaceEntryPointHash);
    const store = await Launcher.initSpaceStore(spaceEntryPoint);

    const resources = await Resources.create({ mesh: mesh, store: store });

    store.setResources(resources);

    return resources;
  }

  static async initTransientSpaceResources(
    spaceHash: Hash,
    entryPoint?: HashedObject,
  ): Promise<Resources> {
    const backend = new MemoryBackendHost(
      Launcher.backendNameForTransientSpace(spaceHash),
    );

    //const backend = new MemoryBackend(HyperBrowserConfig.backendNameForTransientSpace(spaceHash));

    const store = new Store(backend.getProxy());

    const worker = new Worker(new URL('./mesh.worker', import.meta.url));

    const webWorkerMesh = new WebWorkerMeshProxy(worker);

    await webWorkerMesh.ready; // The MeshHost in the web worker will send a message once it is fully
    // operational. We don't want to send any control messages before that,
    // so we'll wait here until we get the 'go' message from the MeshHost.

    const mesh = webWorkerMesh.getMesh();

    const resources = await Resources.create({ mesh: mesh, store: store });

    store.setResources(resources);

    return resources;
  }

  static async initStarterResources() {
    const backend = new WorkerSafeIdbBackend('start-page');
    let dbBackendError: string | undefined = undefined;

    try {
      console.log('Initializing storage backend for starter page...');
      await backend.ready();
      console.log('Storage backend for starter page ready');
    } catch (e: any) {
      dbBackendError = e.toString();
      console.log('Error initializing storage backend for starter page');
      throw new Error(dbBackendError);
    }

    const store = new Store(backend);
    const mesh = new Mesh();

    const resources = await Resources.create({ mesh: mesh, store: store });

    return resources;
  }

  async validate(_references: Map<string, HashedObject>): Promise<boolean> {
    return true;
  }
}

ClassRegistry.register(Launcher.className, Launcher);

export default Launcher;
