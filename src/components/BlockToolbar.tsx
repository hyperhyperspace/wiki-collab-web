import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import { Button, ButtonGroup } from '@mui/material';
import type { Editor } from '@tiptap/core';

const BlockStyleBar = ({ editor }: { editor: Editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="wiki-toolbar">
      <ButtonGroup aria-label="text formatting">
        <Button
          onClick={() => {
            const rangeSelected =
              editor.state.selection.to !== editor.state.selection.from;
            const currentLinkAttributes = editor.getAttributes('link');
            if (currentLinkAttributes.href) {
              editor.commands.unsetLink();
            } else if (!rangeSelected) {
              editor.commands.insertContent('🔗');
            } else {
              const baseLocation = window.location.hash
                .substring(1)
                ?.split('/')
                .slice(0, 4)
                .join('/');
              const pageName = editor.state.doc.textBetween(
                editor.view.state.selection.from,
                editor.view.state.selection.to,
              );
              const result = editor
                .chain()
                .focus()
                .toggleLink({
                  href: `#${baseLocation}/${pageName}`,
                  target: '_self',
                })
                .run();
            }
          }}
          variant={editor.isActive('link') ? 'contained' : 'text'}
          aria-label="bold"
        >
          <LinkIcon />
        </Button>
        <Button
          onClick={e => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          variant={
            editor.isActive('heading', { level: 1 }) ? 'contained' : 'text'
          }
          aria-label="bold"
        >
          h1
        </Button>
        <Button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          variant={
            editor.isActive('heading', { level: 2 }) ? 'contained' : 'text'
          }
          aria-label="bold"
        >
          h2
        </Button>
        <Button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          variant={
            editor.isActive('heading', { level: 3 }) ? 'contained' : 'text'
          }
          aria-label="bold"
        >
          h3
        </Button>
        {/* <Button
            onClick={() => editor.chain().focus().setParagraph().run()} 
            variant={editor.isActive('paragraph') ? 'contained' : 'text'}
            aria-label="paragraph">
            p
        </Button> */}
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          variant={editor.isActive('bold') ? 'contained' : 'text'}
          aria-label="bold"
        >
          <b style={{ fontWeight: 'bolder' }}>b</b>
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          variant={editor.isActive('italic') ? 'contained' : 'text'}
          aria-label="italic"
        >
          <i>i</i>
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          variant={editor.isActive('underline') ? 'contained' : 'text'}
          aria-label="underline"
        >
          <u>u</u>
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          variant={editor.isActive('strike') ? 'contained' : 'text'}
          aria-label="strikethrough selection"
        >
          <s>s</s>
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          variant={editor.isActive('highlight') ? 'contained' : 'text'}
          aria-label="highlight selection"
        >
          {!editor.isActive('highlight') && (
            <span style={{ backgroundColor: 'yellow', padding: '0px 2px' }}>
              h
            </span>
          )}
          {editor.isActive('highlight') && (
            <span style={{ padding: '0px 2px' }}>h</span>
          )}
          {/*<HighlightIcon/>*/}
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          variant={editor.isActive('codeBlock') ? 'contained' : 'text'}
          aria-label="code block"
        >
          <CodeIcon />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default BlockStyleBar;
