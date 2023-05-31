import { Fragment } from 'react';
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router';
import './App.css';

import { CssBaseline, ThemeProvider, Typography } from '@mui/material';
import { lightTheme } from './themes';

import { Hash, MutableArray, MutableSet, Store } from '@hyper-hyper-space/core';
import { ObjectState, useObjectState } from '@hyper-hyper-space/react';

import SpaceLauncher from './pages/SpaceLauncher';
// import WikiSpaceView from './components/WikiSpaceView';
import Launcher from './Launcher';
import SpaceFrame, { SpaceComponent } from './pages/SpaceFrame';
import { WikiSpace } from '@hyper-hyper-space/wiki-collab';

function App(props: { launcher: Launcher }) {
  const spaces = useObjectState(props.launcher.spaces) as ObjectState<
    MutableArray<WikiSpace>
  >;

  const confReady = props.launcher && spaces && spaces.value;
  const {launcher} = props;

  return (
    <Fragment>
      <div style={{ height: '100%' }}>
        <header>
          <CssBaseline />
        </header>
        <ThemeProvider theme={lightTheme}>
          {/* <HyperBrowserEnv homes={homes} config={props.config}> */}
          <Routes>
            <Route path="/" element={<SpaceLauncher launcher={launcher} visible={true} />} />
            <Route
              path="space/:hash"
              element={
                  <SpaceFrame launcher={props.launcher} />
              }
            >
              <Route path="*" element={<SpaceComponent/>} />
              <Route path="" element={<SpaceComponent/>} />
            </Route>
            <Route path="space/:hash" element={<SpaceFrame launcher={props.launcher} />}> 
                
                <Route path="*/launcher" element={<SpaceLauncher launcher={launcher} visible={true} />}></Route>
                <Route index element={<SpaceComponent/>} />
                <Route path="*" element={<SpaceComponent/>} />
             
             </Route>
          </Routes>
          {/* </HyperBrowserEnv> */}
        </ThemeProvider>
      </div>
      <div>
        <p>Loading...</p>
      </div>
      {/* <Outlet context= */}
    </Fragment>
  );
}

export default App;
