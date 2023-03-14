// a HHS space for storing the available wiki spaces and configuring them
//

import { Hash, HashedObject, Mesh, MutableArray, Resources, Store, WebWorkerMeshProxy, WorkerSafeIdbBackend } from "@hyper-hyper-space/core";

class Launcher extends HashedObject {
  static className = "hyper-browser-web/Launcher";
  static version = "1.0.0";

  spaces?: MutableArray<Hash>;


  // constructor() {
  //   super();
  // }

  getClassName(): string {
    return Launcher.className;
  }

  init(): void {
    this.setRandomId();
    this.addDerivedField('spaces', new MutableArray());
  }

  static backendNameForSpace(space: Hash): string {
    return `wiki-collab-${space}`;
  }

  static async initSpaceStore(
    spaceEntryPoint: HashedObject | Hash
  ): Promise<Store> {
    const spaceEntryPointHash =
      spaceEntryPoint instanceof HashedObject
        ? spaceEntryPoint.getLastHash()
        : spaceEntryPoint;

    const backend = new WorkerSafeIdbBackend(
      Launcher.backendNameForSpace(spaceEntryPointHash)
    );

    const store = new Store(backend);

    if (spaceEntryPoint instanceof HashedObject) {
      await store.save(spaceEntryPoint);
    }

    return store;
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

  static async initSpaceResources(
    spaceEntryPoint: HashedObject | Hash
  ): Promise<Resources> {
    const spaceEntryPointHash =
      spaceEntryPoint instanceof HashedObject
        ? spaceEntryPoint.getLastHash()
        : spaceEntryPoint;

    const mesh = await Launcher.initSpaceMesh(
      spaceEntryPointHash
    );
    const store = await Launcher.initSpaceStore(
      spaceEntryPoint
    );

    const resources = await Resources.create({ mesh: mesh, store: store });

    store.setResources(resources);

    return resources;
  }

  async validate(_references: Map<string, HashedObject>): Promise<boolean> {
    return true;
  }
}

export default Launcher;
