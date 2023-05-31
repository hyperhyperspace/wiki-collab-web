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
import { Typography } from '@mui/material';

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

      console.log('loading hash ' + spaceEntryPointHash);

      const resources  = await Launcher.initSpaceResources(spaceEntryPointHash);
      const entryPoint = (await resources.store.load(spaceEntryPointHash)) as WikiSpace;
      setSpaceResources(resources);
      setSpaceEntryPoint(entryPoint);
      
      console.log('space entry point', entryPoint)
      console.log('space resources', resources)
    };

    console.log('initing space frame')
    init();

    return () => {
      console.log('shutting down the wiki ' + spaceEntryPointHash);
      spaceResources?.mesh.shutdown();
      spaceResources?.store.close();

      spaceEntryPoint?.dontWatchForChanges();
    };
  }, [props.launcher]);

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
  console.log('RENDERING SPACE COMP')
  return <>
    {space === undefined && 
      <Typography>Loading...</Typography>
    }
    {space !== undefined &&
      <><Typography>IN</Typography>
      <WikiSpaceView entryPoint={space} />
      </>
    }
  </>
};

export type { SpaceContext };

export default SpaceFrame;
