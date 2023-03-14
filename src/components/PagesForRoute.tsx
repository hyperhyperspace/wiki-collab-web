// a component that displays all of the pages with a given name

import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { WikiContext } from './WikiSpaceView';
import { Page as PageType, PageArray } from '@hyper-hyper-space/wiki-collab';
import { useObjectState } from '@hyper-hyper-space/react';
import { MutationEvent } from '@hyper-hyper-space/core';
import Page from './Page';
import { Stack } from '@mui/material';
import WikiSpaceEditablePageName from './EditablePageName';

function WikiSpacePagesForRoute() {
    const { pageName } = useParams();
    const { wiki } = useOutletContext<WikiContext>();

    const pageArrayState = useObjectState<PageArray>(wiki?.pages, {filterMutations: (ev: MutationEvent) => [...wiki.pages?.values()!].map(page => page.name).includes(ev.emitter), debounceFreq: 50});
    const [pages, setPages] = useState<PageType[]>([]);

    useEffect(() => {
        setPages([...pageArrayState?.getValue()?.values()!].filter((p) => p?.name?.getValue() === pageName));
    }, [pageArrayState, pageName]);

    return (
        <>
            <WikiSpaceEditablePageName/>
            <Stack style={{width: "100%"}} spacing={2} direction="column">
                {pages.map((p) => <Page page={p!} key={p?.getLastHash()}/>)}
            </Stack>
        </>
    );
}

export default WikiSpacePagesForRoute;