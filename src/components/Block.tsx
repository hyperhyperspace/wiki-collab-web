import { useObjectState } from '@hyper-hyper-space/react';
import { Block, BlockType, WikiSpace } from '@hyper-hyper-space/wiki-collab';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import { Fragment, useEffect, useRef, useState } from 'react';
import './Block.css';

import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Italic from '@tiptap/extension-italic';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
// import BlockStyleBar from "./BlockToolbar";
import { CausalReference, MutationEvent } from '@hyper-hyper-space/core';
import { Icon, IconButton, Tooltip } from '@mui/material';
import { Box } from '@mui/system';
import { Editor, Extension } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import History from '@tiptap/extension-history';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import { debounce, map, mapValues } from 'lodash-es';
import { lowlight } from 'lowlight/lib/all.js';
import { useOutlet, useOutletContext } from 'react-router';
import Emoji from './Emoji';
import { FloatingToolbar } from './FloatingToolbar';
import WikiLink from './Link';
import { suggestion, WikiLinkSuggestion } from './LinkSuggestion';
import { WikiContext } from './WikiSpaceView';
import { SpaceContext } from '../pages/SpaceFrame';

function classNames(classes: { [key: string]: boolean }) {
  return Object.entries(classes)
    .filter(([key, value]) => value)
    .map(([key, value]) => key)
    .join(' ');
}

const BlockEditorShortcuts = Extension.create({
  addOptions() {
    return {
      ...this.parent?.(),
      shortcuts: {},
    };
  },
  addKeyboardShortcuts() {
    return mapValues(this.options.shortcuts, fn => fn.bind(this));
  },
});

function WikiSpaceBlock(props: {
  block: Block;
  startedEditing?: any;
  stoppedEditing?: any;
  idx: number;
  showAddBlockMenu: (newAnchorEl: HTMLElement, newBlockIdx?: number) => void;
  removeBlock: () => void;
  addBlockAfter: Function;
  focusOnBlockWithHash?: string;
  focusOnAdjacentBlock?: (block: Block, distance?: number) => void;
}) {
  // const { spaceContext } = useOutletContext<WikiContext>();
  const { launcher, resources, author } = useOutletContext<SpaceContext>();
  const selfAuthor = author!;
  const blockState = useObjectState(props.block, { debounceFreq: 250 });
  const blockContentsState = useObjectState(props.block, { debounceFreq: 250 });
  const [rejectedEdit, setRejectedEdit] = useState<string>();

  const { wiki } = useOutletContext<WikiContext>();
  const pageArrayState = useObjectState<WikiSpace>(wiki, {
    filterMutations: (ev: MutationEvent) => ev.emitter === wiki?.pages,
    debounceFreq: 250,
  });

  const wikiWriteFlags = useObjectState(wiki?.permissionLogic?.writeConfig, {
    debounceFreq: 250,
  });
  const wikiMembers = useObjectState(wiki?.permissionLogic?.members, {
    debounceFreq: 250,
  });

  // check if editable
  const [editable, setEditable] = useState<boolean>(false);
  blockState
    ?.getValue()
    ?.canUpdate(selfAuthor)
    .then(canUpdate => {
      editor?.setEditable(canUpdate, false);
      setEditable(canUpdate);
    });

  // disable debouncing once state has arrived:
  useEffect(() => {
    if (
      blockState?.getValue()?.getValue() !== undefined &&
      blockState.getDebounceFreq() !== undefined
    ) {
      blockState.setDebounceFreq(undefined);
    }
  }, [blockState]);

  useEffect(() => {
    if (
      blockContentsState?.getValue()?.getValue() !== undefined &&
      blockContentsState.getDebounceFreq() !== undefined
    ) {
      blockContentsState.setDebounceFreq(undefined);
    }
  }, [blockContentsState]);

  const [isEditing, setIsEditing] = useState(false);
  const lostFocusTimeout = useRef<number | undefined>();

  const startedEditing = ({
    editor,
    event,
  }: {
    editor: Editor;
    event: FocusEvent;
  }) => {
    if (lostFocusTimeout.current !== undefined) {
      window.clearTimeout(lostFocusTimeout.current);
    }

    lostFocusTimeout.current = window.setTimeout(() => {
      setIsEditing((old: boolean) => {
        if (!old && props.block.type === BlockType.Text) {
          props.startedEditing(editor);
          blockState?.setDebounceFreq(undefined);
          blockContentsState?.setDebounceFreq(undefined);
        }

        return true;
      });
    }, 100);
  };

  const stoppedEditing = () => {
    if (lostFocusTimeout.current !== undefined) {
      window.clearTimeout(lostFocusTimeout.current);
    }
    console.log('stopped editing');

    lostFocusTimeout.current = window.setTimeout(() => {
      setIsEditing((old: boolean) => {
        if (old && props.block.type === BlockType.Text) {
          props.stoppedEditing();
        }

        return false;
      });
    }, 100);
  };

  // for now just use one tiptap `Editor` per block...
  // later on it might be desirable to use a custom tiptap `Block` type instead
  // and share a single tiptap `Editor`.

  const updateBlockWithHtml = useRef(
    debounce(async (blockContents: CausalReference<string>, html: string) => {
      // console.log("attempting to update block...", html);
      await blockContents.setValue(html, selfAuthor);
      blockContents.setResources(resources!);
      blockContents.saveQueuedOps();
      // console.log("SAVED BLOCK");
    }, 1500),
  );

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Strike,
      Italic,
      Heading,
      History,
      Highlight,
      TextAlign,
      Underline,
      BlockEditorShortcuts.configure({
        shortcuts: {
          Enter: function() {
            const $from = this.editor.state.selection.$from;
            const node = $from.node($from.depth);

            if (node && node.type.name === 'codeBlock') {
              return false;
            } else {
              props.addBlockAfter(props.block);
              return true;
            }
          },
          'Shift-Enter': function() {
            const $from = this.editor.state.selection.$from;
            const node = $from.node($from.depth);

            if (node && node.type.name === 'codeBlock') {
              props.addBlockAfter(props.block);
              return true;
            } else {
              return false;
            }
          },
          'Control-Enter': function() {
            const $from = this.editor.state.selection.$from;
            const node = $from.node($from.depth);

            if (node && node.type.name === 'codeBlock') {
              props.addBlockAfter(props.block);
              return true;
            } else {
              return false;
            }
          },
          Backspace: function () {
            const selection = this.editor.view.state.selection;
            const length = this.editor.state.doc.textContent.length;
            // console.log('backspace', selection, length)
            if (selection.empty && selection.head == 1 && length === 0) {
              props.focusOnAdjacentBlock!(props.block, -1);
              props.removeBlock();
              return true;
            }
          },
          ArrowUp: function () {
            const selection = this.editor.view.state.selection;
            // console.log('arrow up', selection)
            if (selection.empty && selection.head == 1) {
              props.focusOnAdjacentBlock!(props.block, -1);
              return true;
            }
          },
          ArrowDown: function () {
            const selection = this.editor.view.state.selection;
            const length = this.editor.state.doc.content.size;
            console.log('arrow down', selection, length, this.editor.state.doc);
            if (selection.empty && selection.head + 1 === length) {
              props.focusOnAdjacentBlock!(props.block, 1);
              return true;
            }
          },
        },
      }),
      WikiLinkSuggestion.configure({
        HTMLAttributes: {
          class: 'link-suggestion',
        },
        suggestion: {
          ...suggestion,
          items: ({ query }: { query: string }) => {
            return [...pageArrayState?.getValue()?.pages?.values()!]
              .map(page => page.name?.getValue()!)
              .filter(item => item)
              .filter(item => item?.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5);
          },
        },
      }),
      Emoji.configure(),
      WikiLink.configure({
        definedPageNames: [...pageArrayState?.getValue()?.pages?.values()!].map(
          page => page.name?.getValue()!,
        ),
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: 'Write something...' }),
    ],
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: async ({ editor }) => {
      if (blockContentsState && !editor.isDestroyed) {
        const attemptedContent = editor.getHTML();
        updateBlockWithHtml
          .current(blockContentsState.getValue()!, editor.getHTML())
          ?.then(
            () => console.log('successfully updated block'),
            () => {
              console.log("couldn't edit!", attemptedContent);
              editor.commands.setContent(
                blockContentsState?.getValue()?.getValue()!,
              );
              setRejectedEdit(attemptedContent);
            },
          );
      }
    },
    editable: false,
    onBlur: stoppedEditing,
    onFocus: startedEditing,
  });

  useEffect(() => {
    if (props.block.getLastHash() === props.focusOnBlockWithHash) {
      editor?.commands.focus();
    }
  }, [props.focusOnBlockWithHash]);

  useEffect(() => {
    const newText = blockContentsState?.getValue()?.getValue();

    if (!newText) {
      return;
    }

    if (!editor?.isDestroyed && newText !== editor?.getHTML()) {
      editor?.commands.setContent(newText, false, {
        preserveWhitespace: 'full',
      });
    }
  }, [blockContentsState, editor]); //, editor, blockState])

  const handleAddBlock = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.showAddBlockMenu(event.currentTarget, props.idx + 1);
  };

  const handleRemoveBlock = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.removeBlock();
  };

  const blockContentView = (
    <Fragment>
      <Box
        className={classNames({
          'wiki-block': true,
          'block-editable': editable,
        })}
      >
        {editable && (
          <>
            <Tooltip title="Click to add a block below">
              <Icon
                onClick={handleAddBlock}
                style={{
                  cursor: 'pointer',
                  height: 'default',
                  width: 'default',
                  overflow: 'visible',
                }}
              >
                <Add></Add>
              </Icon>
            </Tooltip>

            <Icon
              style={{
                height: 'default',
                width: 'default',
                marginRight: '0.25rem',
                overflow: 'visible',
              }}
            >
              <DragIndicator></DragIndicator>
            </Icon>
          </>
        )}

        <div>
          {props.block?.type === BlockType.Text && (
            <div className="wiki-block-wrapper">
              <EditorContent editor={editor} />
              {editor?.isEditable && isEditing && (
                <FloatingToolbar isEditing={isEditing} editor={editor} />
              )}
            </div>
          )}
          {props.block?.type === BlockType.Image && (
            <img
              style={{ width: '100%' }}
              src={blockState?.getValue()?.getValue()}
            />
          )}
        </div>
      </Box>
    </Fragment>
  );

  return blockContentView;
}

export default WikiSpaceBlock;
