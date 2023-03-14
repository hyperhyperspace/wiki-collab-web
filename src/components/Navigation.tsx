import { MutationEvent } from '@hyper-hyper-space/core';
import { useObjectState } from '@hyper-hyper-space/react';
import { Page, PageArray } from '@hyper-hyper-space/wiki-collab';
import { Delete, DragIndicator } from '@mui/icons-material';
import {
  Box,
  Divider,
  Drawer,
  Icon,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
import { useLocation, useOutletContext, useParams } from 'react-router';
import './Navigation.css';
import { WikiContext } from './WikiSpaceView';

function PageListItem(props: {
  page: Page;
  pageArray: PageArray;
  canEditPageArray: boolean;
  provided: DraggableProvided;
}) {
  const { page, canEditPageArray, provided, pageArray } = props;
  const { pageName: pageNameFromRoute } = useParams();
  const pageName = useObjectState(page.name)?.getValue()?.getValue();
  const pageArrayState = useObjectState(pageArray);
  const { nav, spaceContext } = useOutletContext<WikiContext>();
  const { launcher } = spaceContext;
  return (
    <ListItemButton
      selected={pageNameFromRoute === pageName}
      onClick={() => nav.goToPage(pageName as string)}
      key={'navigation-for-' + page.getLastHash()}
      className={canEditPageArray ? 'editable-tab page-tab' : 'page-tab'}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
    >
      <Stack
        direction="row"
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <Stack
          direction="row"
          style={{ alignItems: 'center', justifyContent: 'flex-start' }}
        >
          {/* {canEditPageArray && (
      <Icon
        style={{
          height: "default",
          width: "default",
          marginRight: "0.25rem",
          overflow: "visible",
          marginTop: "-3px"
        }}
      >
        <DragIndicator />
      </Icon>
    )} */}
          <Typography
            className={
              pageName === pageNameFromRoute ? 'currently-selected' : ''
            }
          >
            {page.name?.getValue()}
          </Typography>
        </Stack>
        {canEditPageArray && (
          <Tooltip hidden={!canEditPageArray} title="Click to remove this page">
            <IconButton
              className="delete-page"
              onClick={(evt: React.MouseEvent<any>) => {
                evt.stopPropagation();
                pageArrayState?.value?.deleteElement(
                  page,
                  launcher?.getAuthor(),
                );
                pageArrayState?.value?.save();
                if (page.name === pageName) {
                  nav.goToIndex();
                }
              }}
              style={{
                cursor: 'pointer',
                height: 'default',
                width: 'default',
                overflow: 'visible',
              }}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </ListItemButton>
  );
}

function Navigation(props: { width: string; redirect?: boolean }) {
  const { nav, wiki, spaceContext } = useOutletContext<WikiContext>();
  const { launcher } = spaceContext;
  const { pageName } = useParams();
  const { pathname } = useLocation();
  const onSettingsPage = pathname.includes('/settings/');
  const onAddPage = pathname.includes('/add-page');

  const wikiState = useObjectState(wiki);
  // const pageArrayState = useObjectState<PageArray>(wiki?.pages);
  const pageArrayState = useObjectState<PageArray>(wiki?.pages, {
    filterMutations: (ev: MutationEvent) =>
      [...wiki.pages?.values()!].map(page => page.name).includes(ev.emitter),
    debounceFreq: 50,
  });

  const [canEditPageArray, setCanEditPageArray] = useState<boolean>(false);

  const onDragEnd = async (result: DropResult) => {
    const from = result.source.index;
    const to = result.destination?.index;
    if (to === undefined) {
      return;
    }

    wiki.movePage(from, to, launcher?.getAuthor()!);
  };

  useEffect(() => {
    let cancel = false;

    pageArrayState
      ?.getValue()
      ?.canInsert(undefined, 0, spaceContext?.launcher?.getAuthor())
      .then((canInsert: boolean) => {
        if (cancel) return;
        setCanEditPageArray(canInsert);
      });

    return () => {
      cancel = true;
    };
  }, [pageArrayState, spaceContext?.launcher]);

  const [filterText, setFilterText] = useState<string>('');

  const onFilterTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    setFilterText(newValue);
  };

  const filterPage = (p: Page, filterText: string) =>
    filterText.trim() === '' ||
    (p.name
      ?.getValue()
      ?.toLowerCase()
      ?.indexOf(filterText.trim().toLocaleLowerCase()) as number) >= 0;

  useEffect(() => {
    if (props.redirect) {
      if (pageArrayState?.getValue()?.size() || 0 > 0) {
        nav.goToPage(
          pageArrayState?.getValue()?.values().next().value.name?.getValue(),
        );
      }
    }
  }, [pageArrayState]);

  const pageTabElements = Array.from(
    wikiState?.getValue()?.getAllowedPages() || [],
  )
    .filter((page: Page) => filterPage(page, filterText))
    .map(
      (page: Page, index: any) =>
        page.name?.getValue() && (
          <Draggable
            draggableId={page.getLastHash()}
            index={index}
            key={page.getLastHash()}
          >
            {provided => (
              <PageListItem
                page={page}
                provided={provided}
                pageArray={pageArrayState?.getValue()!}
                canEditPageArray={canEditPageArray}
              />
            )}
          </Draggable>
        ),
    );

  const currentPageStyle = { fontWeight: 'bold' };
  return (
    <Box>
      <List
        style={{
          width: '100%',
          paddingTop: '0px',
          margin: '0px',
          padding: '0px',
        }}
        dense
      >
        <ListItem>
          <Typography
            variant="h5"
            style={{
              color:
                wikiState?.getValue()?.title?.getValue() === undefined
                  ? 'gray'
                  : 'unset',
            }}
          >
            {wikiState?.getValue()?.title?.getValue() || 'Fetching title...'}
          </Typography>
        </ListItem>
        <ListItem>
          <TextField
            placeholder="Filter pages"
            value={filterText}
            onChange={onFilterTextChange}
            size="small"
            InputProps={{
              autoComplete: 'off',
              style: {},
              endAdornment: (
                <InputAdornment position="end">
                  <img
                    alt="search icon"
                    src="icons/streamline-icon-search@48x48.png"
                    style={{
                      width: '24px',
                      height: '24px',
                      margin: '1px',
                      padding: '2px',
                    }}
                  ></img>
                </InputAdornment>
              ),
            }}
          ></TextField>
        </ListItem>
        {canEditPageArray && (
          <ListItemButton
            selected={onSettingsPage}
            onClick={nav.goToPermissionSettings}
            className="page-tab"
          >
            <Typography className={onSettingsPage ? 'currently-selected' : ''}>
              Settings
            </Typography>
          </ListItemButton>
        )}
      </List>
      <Divider />
      {/* saved pages */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={wiki.getId()!}>
          {provided => (
            <List
              dense
              style={{
                width: '100%',
                paddingTop: '0px',
                margin: '0px',
                padding: '0px',
              }}
            >
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {pageTabElements}
                {provided.placeholder}
              </div>
            </List>
          )}
        </Droppable>
      </DragDropContext>
      <List dense style={{ width: '100%', paddingTop: '0px' }}>
        {/* unsaved pages */}
        {pageName &&
          !Array.from(wikiState?.getValue()?.getAllowedPages()!)
            .map(p => p.name?.getValue())
            .includes(pageName) && (
            <ListItemButton
              selected={true}
              className={
                canEditPageArray ? 'editable-tab page-tab' : 'page-tab'
              }
            >
              <Typography
                className="currently-selected"
                style={{
                  textDecoration: 'underline dotted',
                }}
              >
                {pageName}
              </Typography>
            </ListItemButton>
          )}
        {/* add page */}
        {canEditPageArray && (
          <ListItemButton
            onClick={nav.goToAddPage}
            selected={onAddPage}
            className={canEditPageArray ? 'editable-tab page-tab' : 'page-tab'}
          >
            <Typography className={onAddPage ? 'currently-selected' : ''}>
              + add page
            </Typography>
          </ListItemButton>
        )}
      </List>
      {/* </Drawer> */}
    </Box>
  );
}

export default Navigation;
