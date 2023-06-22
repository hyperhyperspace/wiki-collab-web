import { ObjectState, useObjectState } from '@hyper-hyper-space/react';
import { WikiSpace } from '@hyper-hyper-space/wiki-collab';
import { FormControl, Input, InputLabel, Stack, TextField } from '@mui/material';
import * as React from 'react';
import { useOutletContext } from 'react-router';
import WikiSpacePermissionSettings from './PermissionSettings';
import { WikiContext } from './WikiSpaceView';

function TitleSetting() {
  const { wiki } = useOutletContext<WikiContext>();
  const wikiState = useObjectState(wiki) as ObjectState<WikiSpace>;

  // const [canEdit, setCanEdit] = React.useState<boolean>(false);

  // wikiState.value?.title
  //   ?.value?.canUpdate(selfAuthor)!
  //   .then((canUpdate: boolean) => {
  //     setCanEdit(canUpdate);
  //   });

  return (
    <>
      <TextField
        id="title"
        label="Title"
        value={wikiState.value?.title?.getValue()}
        onChange={e =>
          wikiState.value && wikiState.value.title?.setValue(e.target.value)
        }
      />
    </>
  );
}

export default function WikiSpaceSettingsPage() {
  return (
    <Stack>
      <TitleSetting />
      <WikiSpacePermissionSettings />
    </Stack>
  );
}
