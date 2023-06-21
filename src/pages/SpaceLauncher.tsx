import { Accordion, Box, Button, ListItemButton, TextField, Typography } from "@mui/material";
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Launcher from "../Launcher";
import { Identity, RSAKeyPair } from "@hyper-hyper-space/core";
import { WikiSpace } from "@hyper-hyper-space/wiki-collab";
import { useNavigate } from "react-router";
import SiteTitle from "../components/SiteTitle";
import { useObjectState } from "@hyper-hyper-space/react";
import React, { useEffect } from "react";

// an enum for the three possible states of the launcher
enum LauncherState {
  CREATE,
  OPEN,
  IMPORT,
}

// a card for each space, that uses a useObjectState hook for the space title
function SpaceCard(props: { space: WikiSpace, launcher: Launcher }) {
  const { space } = props;
  const spaceState = useObjectState(space);
  const navigate = useNavigate();
  
  useEffect(() => {
    Launcher.initSpaceStore(space).then((spaceStore) => {
      space.setStore(spaceStore);
      console.log('watching for changes on space title', space, spaceState?.value?.title)
      spaceState?.value?.title?.loadAllChanges();

    });
    return () => {
      spaceState?.value?.title?.dontWatchForChanges();
    }
  }, [spaceState?.value?.title, space]);
  
  return (
    <ListItemButton
      onClick={() => 
        navigate(
          "/space/" + encodeURIComponent(space.getLastHash())
        )
      }
      sx={{ width: '100%' }}
    >
      { spaceState?.value?.title?.getValue() }
    </ListItemButton>
  );
}

export default function SpaceLauncher(props: { visible: boolean, launcher: Launcher }) {
  const { launcher } = props;
  const [newSpaceTitle, setNewSpaceTitle] = React.useState<string>("Untitled wiki");
  async function newSpace(newSpaceTitle: string) {
    const kp = await RSAKeyPair.generate(2048);

    const creator = Identity.fromKeyPair({}, kp);
    console.log('Generated wiki creator', creator);
    const space = await new WikiSpace([creator].values());
    console.log('new space', space, space.getAuthor())
    //await space.init(); <-- this get called on the constructor automatically :-)
    
    const spaceStore = await Launcher.initSpaceStore(space);
    await spaceStore.save(kp);
    space.setStore(spaceStore);
    
    const spaceResources = await Launcher.initSpaceResources(space);
    space.setResources(spaceResources);

    await space.createWelcomePage("your new wiki", creator);
    await space.save();
    await space.title?.save();
    await launcher.spaces?.push(space, launcher.getAuthor()!);

    space.title?.setValue(newSpaceTitle);
    console.log('about to create welcome page...', space.title?.getValue())
    console.log('created welcome page', space.title?.getValue())

    await launcher.spaces?.save();
    await launcher.save();
    setExpanded(LauncherState.OPEN);
    navigate(
      "/space/" + encodeURIComponent(space.getLastHash())
    )
  }
  
  const spaces = useObjectState(launcher.spaces)
  
  const navigate = useNavigate();

  // const { launcher, components } = props;
  const [expanded, setExpanded] = React.useState<LauncherState | false>(LauncherState.OPEN);
  
  const handleChange = (panel: LauncherState) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  }

  // using the material UI `Accordion` component
  const components = [
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <TextField
          label="Space title"
          variant="outlined"
          fullWidth
          onChange={(event) => setNewSpaceTitle(event.target.value)}
        />
        <Button variant="contained" key={LauncherState.CREATE} onClick={() => newSpace(newSpaceTitle)}>Create space</Button>
      </Box>
    </>,
    <Box sx={{ width: '100%' }} key={LauncherState.OPEN} >
      {[...spaces?.value?.values() || []]?.reverse().map((space) => (
        <SpaceCard key={space.getLastHash()} space={space} launcher={launcher} />
      ))}
    </Box>,
    // <Button key={LauncherState.IMPORT} onClick={() => navigate('/import')}>Import an existing space</Button>,
  ]

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        maxWidth: "500px",
        // also, center the launcher vertically
        margin: "auto",
      }}
    >
      <SiteTitle />
      {props.visible && (
        <>
          {Object.keys(components).map((key) => {
            const state = parseInt(key);
            return (
              <Accordion key={key} expanded={expanded === state} onChange={handleChange(state)} sx={{ width: '100%' }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${state}-content`}
                  id={`panel${state}-header`}
                >
                  <Typography sx={{ fontWeight: 'bold' }}>{state === LauncherState.CREATE ? 'Create a new space' : state === LauncherState.OPEN ? 'Open a saved space' : 'Import an existing space'}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {components[state]}
                </AccordionDetails>
              </Accordion>
            );
          }
        )}
        </>
      )}
    </Box>
  );
}
