import { Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';

import * as React from 'react';

import { useNavigate, useOutletContext } from 'react-router';
import { WikiContext } from './WikiSpaceView';
import { SpaceContext } from '../pages/SpaceFrame';

function NewPage(props: { noNavigation: boolean; contentWidth: string }) {
  const { wiki, nav } = useOutletContext<WikiContext>();
  const { launcher, author } = useOutletContext<SpaceContext>();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goToPage();
    } else {
      setNameError(false);
    }
  };

  const goToPage = () => {
    let err = false;

    if (name.trim() === '') {
      setNameError(true);
      err = true;
    }


    if (author === undefined) {
      // TODO: make an actual window with a link to set up an identity?
      alert(
        'This page does not exist, you need to set up an account to be able to create it',
      );
    }

    if (!err && author !== undefined) {
      if (wiki.getPage(name) === undefined) {
        const p = wiki.createPage(name);
        wiki.addPage(p, author);
      }

      nav.goToPage(name);
    }
  };

  const navigate = useNavigate();

  return (
    <Stack style={{ width: '100%' }} spacing={2} direction="column">
      <TextField
        value={name}
        onChange={handleNameChange}
        onKeyPress={handleNameKeyPress}
        error={nameError}
        helperText={nameError ? 'Please enter a name' : ''}
        fullWidth
        placeholder="Untitled page"
        InputProps={{
          autoComplete: 'off',
        }}
      />

      <Stack direction="row" spacing={1}>
        <Button variant="contained" size="medium" onClick={goToPage}>
          Add new page
        </Button>
        {props.noNavigation && (
          <Button
            variant="outlined"
            size="medium"
            onClick={() => {
              navigate(-1);
            }}
          >
            Cancel
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

export default NewPage;
