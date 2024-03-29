// a component that displays all of the pages with a given name

import { MutationEvent } from '@hyper-hyper-space/core';
import { useObjectState } from '@hyper-hyper-space/react';
import { Page as PageType, PageArray } from '@hyper-hyper-space/wiki-collab';
import { Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';
import WikiSpaceEditablePageName from './EditablePageName';
import Page from './Page';
import { WikiContext } from './WikiSpaceView';

function WikiSpacePagesForRoute() {
  const { pageName } = useParams();
  const { wiki } = useOutletContext<WikiContext>();

  const pageArrayState = useObjectState<PageArray>(wiki?.pages, {
    filterMutations: (ev: MutationEvent) =>
      [...wiki.pages?.values()!].map(page => page.name).includes(ev.emitter),
    debounceFreq: 50,
  });
  const [pages, setPages] = useState<PageType[]>([]);

  useEffect(() => {
    setPages(
      [...pageArrayState?.getValue()?.values()!].filter(
        p => p?.name?.getValue() === pageName,
      ),
    );
  }, [pageArrayState, pageName]);

  return (
    <>
      <WikiSpaceEditablePageName />
      <Stack style={{ width: '100%' }} spacing={2} direction="column">
        {pages.map(p => (
          <Page page={p!} key={p?.getLastHash()} />
        ))}
      </Stack>
    </>
  );
}

export default WikiSpacePagesForRoute;
