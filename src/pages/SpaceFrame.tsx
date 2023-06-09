import {
  Hash,
  HashedObject,
  IdbBackend,
  Identity,
  MutableSet,
  Resources,
  SpaceEntryPoint,
} from '@hyper-hyper-space/core';
import { useObjectDiscoveryIfNecessary } from '@hyper-hyper-space/react';
import { Fragment, useEffect, useState } from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router';

import Launcher from '../Launcher';

// import { HyperBrowserConfig } from '../../model/HyperBrowserConfig';

import { WikiSpace } from '@hyper-hyper-space/wiki-collab';
import { Typography } from '@mui/material';
import WikiSpaceView from '../components/WikiSpaceView';

type InitParams = {
  hash?: Hash;
  resourcesForDiscovery?: Resources;
  knownEntryPoint?: HashedObject & SpaceEntryPoint & WikiSpace;
};

type SpaceContext = {
  space?: WikiSpace;
  resources?: Resources;
  launcher: Launcher;
  author?: Identity;
};

function SpaceFrame(props: { launcher: Launcher }) {
  const params = useParams();

  const spaceEntryPointHash = decodeURIComponent(params.hash as Hash) as Hash;
  console.log('space entry point hash', spaceEntryPointHash);
  // console.log('space entry point hash', spaceEntryPointHash)

  let isSaved = false;
  // const [foundLocalCopy, setFoundLocalCopy] = useState<boolean>(false);
  // const [homeHash, setHomeHash] = useState<Hash>();
  // const [home, setHome] = useState<Home|undefined>(undefined);

  const [initParams, setInitParams] = useState<InitParams | undefined>(
    undefined,
  );

  const initResult = useObjectDiscoveryIfNecessary<
    HashedObject & SpaceEntryPoint & WikiSpace
  >(
    initParams?.resourcesForDiscovery,
    initParams?.hash,
    initParams?.knownEntryPoint,
  );

  // const spaceEntryPointHash = decodeURIComponent(params.hash as Hash) as Hash;
  const [spaceEntryPoint, setSpaceEntryPoint] = useState<
    (HashedObject & SpaceEntryPoint & WikiSpace) | undefined
  >(undefined);
  const [spaceResources, setSpaceResources] = useState<Resources | undefined>(
    undefined,
  );

  //const [spaceComponent, setSpaceComponent] = useState<JSX.Element|undefined>(undefined);

  let transientSpaceResources: Resources | undefined;
  let starterResources: Resources | undefined;

  useEffect(() => {
    const init = async () => {
      // load a new IDB backend if we don't have one already

      console.log('loading hash ' + spaceEntryPointHash);

      // const resources = await Launcher.initSpaceResources(spaceEntryPointHash);
      // console.log('space resources', resources);
      
      // const entryPoint = (await resources.store.load(
      //   spaceEntryPointHash,
      // )) as WikiSpace;
      // console.log('space entry point', entryPoint);

      // setSpaceResources(resources);
      isSaved = await Launcher.savedSpaceStoreExists(spaceEntryPointHash);

      let savedSpaceResources: Resources | undefined;

      if (isSaved) {
        console.log('space was saved')
        savedSpaceResources = await Launcher.initSpaceResources(
          spaceEntryPointHash,
        );
        const knownEntryPoint = await savedSpaceResources.store.load<
          HashedObject & SpaceEntryPoint & WikiSpace
        >(spaceEntryPointHash, false);
        if (knownEntryPoint !== undefined) {
          console.log('known entry point', knownEntryPoint)
          setSpaceResources(savedSpaceResources);
          setInitParams({ knownEntryPoint: knownEntryPoint });
        } else {
          isSaved = false; // oooops;
          console.log(
            'Space was saved, but it is missing in the corresponding store!',
          );
        }
      } else if (!isSaved) {
        console.log('space was not saved')
        transientSpaceResources = await Launcher.initTransientSpaceResources(
          spaceEntryPointHash,
        );
        setSpaceResources(transientSpaceResources);

        starterResources = await Launcher.initStarterResources();
        setInitParams({
          hash: spaceEntryPointHash,
          resourcesForDiscovery: starterResources,
        });
      }
    };

    console.log('initing space frame');
    init();

    return () => {
      console.log('shutting down the wiki ' + spaceEntryPointHash);
      spaceResources?.mesh.shutdown();
      spaceResources?.store.close();

      spaceEntryPoint?.dontWatchForChanges();
    };
  }, [props.launcher]);

  useEffect(() => {
    console.log('checking...');
    console.log('space resources:', spaceResources);
    console.log('init result:', initResult);

    if (spaceResources !== undefined && initResult !== undefined) {
      console.log('initializing...');
      console.log(initResult);
      initResult?.setResources(spaceResources);
      setSpaceEntryPoint(initResult);
    }
  }, [spaceResources, initResult]);

  const spaceAuthor = spaceEntryPoint?.owners?.values().next().value as Identity;
  const launcherAuthor = props.launcher?.getAuthor() as Identity; 

  const spaceContext: SpaceContext = {
    space: spaceEntryPoint,
    resources: spaceResources,
    launcher: props.launcher,
    author: spaceAuthor?.hasKeyPair() ? spaceAuthor : launcherAuthor,
  };

  console.log('rendering space frame', spaceContext);

  return (
    <Fragment>
      <Outlet context={spaceContext} />
    </Fragment>
  );
}

export const SpaceComponent = () => {
  const { space } = useOutletContext<SpaceContext>() as SpaceContext;
  // const basePath = '/space/' + encodeURIComponent(wiki.getLastHash());
  console.log('--- RENDERING SPACE COMPONENT ---');
  return (
    <>
      {space === undefined && <Typography>Loading...</Typography>}
      {space !== undefined && (
        <>
          <WikiSpaceView entryPoint={space} />
        </>
      )}
    </>
  );
};

export type { SpaceContext };

export default SpaceFrame;
