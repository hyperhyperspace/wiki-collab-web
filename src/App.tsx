import './App.css';
import { Fragment } from 'react';
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router';

import { CssBaseline, ThemeProvider, Typography } from '@mui/material';
import { lightTheme } from './themes';

import { Hash, MutableArray, MutableSet, Store }     from '@hyper-hyper-space/core';
import { ObjectState, useObjectState } from '@hyper-hyper-space/react';

import SpaceLauncher from './pages/SpaceLauncher';
// import WikiSpaceView from './components/WikiSpaceView';
import SpaceFrame from './pages/SpaceFrame';
import Launcher from './Launcher';


function App(props: {launcher: Launcher}) {

  const spaces = useObjectState(props.launcher.spaces) as ObjectState<MutableArray<Hash>>;

  const confReady = props.launcher && spaces && spaces.value;

  return (
    <Fragment>
      <div style={{height: "100%"}}> 
      <header>
        <CssBaseline />
      </header>
      <ThemeProvider theme={lightTheme}>
        {/* <HyperBrowserEnv homes={homes} config={props.config}> */}
          <Routes>
            <Route path="/" element={<SpaceLauncher/>} />
            <Route path="space/:hash" element={<SpaceFrame launcher={props.launcher}/>}>
            </Route>
          </Routes>
        {/* </HyperBrowserEnv> */}
      </ThemeProvider>
      
    </div>
    <div><p>Loading...</p></div> 
    </Fragment>

  );
}

export default App;
