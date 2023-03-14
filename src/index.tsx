import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

import {
  Hash,
  MutableArray,
  Store,
  WorkerSafeIdbBackend,
} from '@hyper-hyper-space/core';
// import { HyperBrowserConfig } from './model/HyperBrowserConfig';
import { Home } from '@hyper-hyper-space/home';
import Launcher from './Launcher';

const main = async () => {
  const configBackend = new WorkerSafeIdbBackend(
    'wiki-collab-launcher-' + Launcher.version,
  );
  let launcherBackendError: string | undefined = undefined;

  try {
    console.log('Initializing configuration storage backend...');
    await configBackend.ready();
    console.log('Configuration storage backend ready');
  } catch (e: any) {
    console.log(e);
    launcherBackendError = e.toString();
  }

  const launcherStore = new Store(configBackend);

  const launcher = new Launcher();
  launcher.setStore(launcherStore);
  await launcherStore.save(launcher);

  ReactDOM.render(
    <React.StrictMode>
      <HashRouter>
        <App launcher={launcher} />
      </HashRouter>
    </React.StrictMode>,
    document.getElementById('root'),
  );

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  //reportWebVitals();
};

main();
