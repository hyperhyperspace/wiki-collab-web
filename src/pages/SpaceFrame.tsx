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
  author?: Identity;
};

function SpaceFrame(props: { launcher: Launcher }) {
  const params = useParams();


  const spaceEntryPointHash = decodeURIComponent(params.hash as Hash) as Hash;
  // console.log('space entry point hash', spaceEntryPointHash)

    // const [foundLocalCopy, setFoundLocalCopy] = useState<boolean>(false);
    // const [homeHash, setHomeHash] = useState<Hash>();
    // const [home, setHome] = useState<Home|undefined>(undefined);

    // const [initParams, setInitParams] = useState<InitParams|undefined>(undefined);

    // const initResult = useObjectDiscoveryIfNecessary<HashedObject & SpaceEntryPoint>(initParams?.resourcesForDiscovery, initParams?.hash, initParams?.knownEntryPoint);

    // const spaceEntryPointHash = decodeURIComponent(params.hash as Hash) as Hash;
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
      
      console.log('space entry point', spaceEntryPoint)
      console.log('space resources', spaceResources)
    };

    console.log('initing space frame')
    init();

    return () => {
      spaceResources?.mesh.shutdown();
      spaceResources?.store.close();

      spaceEntryPoint?.dontWatchForChanges();
    };
  }, []);

  const spaceContext: SpaceContext = {
    space: spaceEntryPoint,
    resources: spaceResources,
    launcher: props.launcher,
    author: props.launcher.getAuthor(),
  };

  console.log('rendering space frame', spaceContext)

  return (
    <Fragment>
      LOL
      <Outlet context={spaceContext} />
    </Fragment>
  );
}

export const SpaceComponent = () => {
  const { space } = useOutletContext<SpaceContext>() as SpaceContext;
  // const basePath = '/space/' + encodeURIComponent(wiki.getLastHash());
  return <>
    hmm
    <WikiSpaceView entryPoint={space!} />;
  </>
};

export type { SpaceContext };

export default SpaceFrame;
