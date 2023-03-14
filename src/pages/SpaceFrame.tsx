import {
  Hash,
  HashedObject,
  IdbBackend,
  Identity,
  MutableSet,
  Resources,
  SpaceEntryPoint,
} from '@hyper-hyper-space/core';
import { Fragment, useEffect, useState } from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router';

import Launcher from '../Launcher';

// import { HyperBrowserConfig } from '../../model/HyperBrowserConfig';

import { WikiSpace } from '@hyper-hyper-space/wiki-collab';
import WikiSpaceView from '../components/WikiSpaceView';

// type InitParams = {hash?: Hash, resourcesForDiscovery?: Resources, knownEntryPoint?: HashedObject & SpaceEntryPoint};

type SpaceContext = {
  space?: WikiSpace;
  resources?: Resources;
  launcher: Launcher;
};

function SpaceFrame(props: { launcher: Launcher }) {
  const params = useParams();

  const spaceEntryPointHash = decodeURIComponent(params.hash as Hash) as Hash;

  const [spaceEntryPoint, setSpaceEntryPoint] = useState<
    (HashedObject & SpaceEntryPoint & WikiSpace) | undefined
  >(undefined);
  const [spaceResources, setSpaceResources] = useState<Resources | undefined>(
    undefined,
  );

  //const [spaceComponent, setSpaceComponent] = useState<JSX.Element|undefined>(undefined);

  useEffect(() => {
    const init = async () => {
      // load a new IDB backend if we don't have one already
      setSpaceResources(await Launcher.initSpaceResources(spaceEntryPointHash));
      setSpaceEntryPoint(
        (await spaceResources?.store.load(spaceEntryPointHash)) as WikiSpace,
      );
    };

    init();

    return () => {
      spaceResources?.mesh.shutdown();
      spaceResources?.store.close();

      spaceEntryPoint?.dontWatchForChanges();
    };
  }, [spaceEntryPointHash]);

  const spaceContext: SpaceContext = {
    space: spaceEntryPoint,
    resources: spaceResources,
    launcher: props.launcher,
  };

  return (
    <Fragment>
      <Outlet context={spaceContext} />
    </Fragment>
  );
}

export const SpaceComponent = () => {
  const { space: wiki } = useOutletContext() as SpaceContext;
  return <WikiSpaceView entryPoint={wiki!} />;
};

export type { SpaceContext };

export default SpaceFrame;
