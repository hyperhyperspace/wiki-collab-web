import { WikiSpace } from '@hyper-hyper-space/wiki-collab';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Fragment, ReactElement, ReactNode, useEffect } from 'react';
import {
  Outlet,
  Route,
  Routes,
  useNavigate,
  useOutletContext,
} from 'react-router';
import { SpaceContext } from '../pages/SpaceFrame';
import Navigation from './Navigation';
import NewPage from './NewPage';
import WikiSpacePagesForRoute from './PagesForRoute';
import WikiSpaceSettingsPage from './SettingsPage';
import './WikiSpaceView.css';
import { Identity, Resources } from '@hyper-hyper-space/core';
import Launcher from '../Launcher';
import SpaceLauncher from '../pages/SpaceLauncher';

type WikiNav = {
  goToPage: (pageName: string, rewrite?: boolean) => void;
  goToAddPage: () => void;
  goToIndex: () => void;
  goToPermissionSettings: () => void;
};

type WikiContext = {
  wiki: WikiSpace;
  nav: WikiNav;
  resources: Resources;
  author: Identity;
};

function WikiSpaceView(props: { entryPoint: WikiSpace; basePath?: string }) {
  const {author, resources, launcher} = useOutletContext<SpaceContext>();
  console.log('WikiSpaceView', author, resources, props.entryPoint)
  const { basePath } = { basePath: '' };

  const wiki = props.entryPoint;

  useEffect(() => {
    wiki.startSync();

    return () => {
      wiki.stopSync();
      wiki.title?.dontWatchForChanges();
    };
  }, [wiki]);

  const navigate = useNavigate();

  const goToPage = (pageName: string, replace = false) => {
    navigate(
        // basePath +
        'contents/' +
        encodeURIComponent(pageName),
        { replace }
    );
  };

  const goToAddPage = () => {
    navigate('add-page');
  };

  const goToIndex = () => {
    navigate('index');
  };

  const goToPermissionSettings = () => {
    navigate(
        'settings/permissions',
    );
  };

  const context: WikiContext = {
    wiki: wiki,
    resources: resources!,
    author: author!,
    nav: {
      goToPage: goToPage,
      goToAddPage: goToAddPage,
      goToIndex: goToIndex,
      goToPermissionSettings,
    },
  };

  console.log('wiki context', context)

  const theme = useTheme();
  const tablet = useMediaQuery(theme.breakpoints.down('md'));
  const noNavigation = useMediaQuery(theme.breakpoints.down('md'));

  const navigationWidth = noNavigation ? '100%' : tablet ? '20%' : '22%';
  const contentWidth = noNavigation ? '100%' : tablet ? '80%' : '78%';

  const BackToIndexButton = () => (
    <>
      <Stack direction="row" spacing="3px" style={{ alignItems: 'center' }}>
        <IconButton
          onClick={context.nav.goToIndex}
          style={{ cursor: 'pointer', paddingTop: '6px', paddingRight: '3px' }}
        >
          <img
            alt="back to index"
            src="icons/streamlinehq-arrow-thick-left-arrows-diagrams-48x48.png"
            style={{
              width: '24px',
              height: '24px',
              margin: '1px',
              padding: '2px',
            }}
          ></img>
        </IconButton>
        <Button
          size="small"
          style={{ textTransform: 'none', textAlign: 'left' }}
          variant="text"
          onClick={context.nav.goToIndex}
        >
          <Typography> Index</Typography>
        </Button>
      </Stack>
    </>
  );

  const Frame: React.FC<{ title?: string | ReactElement }> = ({
    children,
    title,
  } : {
    children?: ReactNode;
    title?: string | ReactElement;
  }): JSX.Element => {
    return (
      <>
        <div className="wiki-container">
          {!noNavigation && (
            <Paper
              // variant="permanent"
              sx={{
                width: navigationWidth,
                margin: 0,
                padding: 0,
                flexShrink: 0,
                maxWidth: '300px',
                '& .MuiDrawer-paper': {
                  width: navigationWidth,
                  boxSizing: 'border-box',
                },
              }}
              // anchor="left"
            >
              <Navigation width={navigationWidth} />
            </Paper>
          )}
          <Stack
            style={{ height: '100%', width: '100%', maxWidth: '100vw' }}
            spacing="0.1rem"
            sx={{ maxWidth: 'lg' }}
          >
            {noNavigation && <BackToIndexButton />}
            <Stack
              direction="row"
              style={{ height: '100%', width: '100%' }}
              spacing="0.1rem"
              sx={{ maxWidth: 'lg' }}
            >
              <div
                style={{
                  padding: noNavigation ? '0' : '0 2rem',
                  width: '100%',
                }}
              >
                {/* // check if title is a string or a react element */}
                {typeof title === 'string' ? (
                  <Typography variant="h6" align="center">
                    {title}
                  </Typography>
                ) : (
                  title
                )}
                <Box>{children}</Box>
              </div>
            </Stack>
          </Stack>
        </div>
      </>
    );
  };

  return (
    <Routes>
      <Route
        path=""
        element={
          <Fragment>
            <Outlet context={context} />
          </Fragment>
        }
      >
        <Route
          path=""
          element={
            <Box className="wiki-container">
              <Stack
                direction="row"
                style={{ height: '100%', width: '100%' }}
                spacing="5rem"
                // sx={{ maxWidth: 'lg' }}
              >
                <Navigation width={navigationWidth} redirect />
                <Paper style={{ width: contentWidth }}>
                  <Typography>Fetching wiki contents...</Typography>
                </Paper>
              </Stack>
            </Box>
          }
        />
        <Route
          path="index"
          element={
            <div className="wiki-container">
              <Stack
                direction="row"
                style={{ height: '100%', width: '100%' }}
                spacing="5rem"
                sx={{ maxWidth: 'lg' }}
              >
                <Navigation width="100%" />
              </Stack>
            </div>
          }
        />
        <Route
          path="contents/:pageName"
          element={
            <Frame>
              <WikiSpacePagesForRoute />
            </Frame>
          }
        />
        <Route
          path="settings/*"
          element={
            <Frame title="Settings">
              <WikiSpaceSettingsPage />
            </Frame>
          }
        />
        <Route
          path="launcher"
          element={
            <Frame title="Launcher">
              <SpaceLauncher launcher={launcher!} visible={true}/>
            </Frame>
          }
        />
        <Route
          path="add-page"
          element={
            <Frame title="New Page">
              <NewPage
                noNavigation={noNavigation}
                contentWidth={contentWidth}
              />
            </Frame>
          }
        />
      </Route>
    </Routes>
  );
}

export type { WikiContext };

export default WikiSpaceView;
