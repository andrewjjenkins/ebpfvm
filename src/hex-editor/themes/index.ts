export type Color = string;

export type HexEditorTheme = {
  asciiPaddingX: string | number,
  bytePaddingX: string | number,
  separatorBytePaddingX: string | number,
  rowPaddingY: string | number,
  scrollWidth: string | number,
  cursorBlinkSpeed: string,
  colorBackground: Color,
  colorBackgroundColumnEven: Color,
  colorBackgroundColumnOdd: Color,
  colorBackgroundCursor: Color,
  colorBackgroundCursorHighlight: Color,
  colorBackgroundEven: Color,
  colorBackgroundInactiveCursor: Color,
  colorBackgroundInactiveCursorHighlight: Color,
  colorBackgroundInactiveSelection: Color,
  colorBackgroundInactiveSelectionCursor: Color,
  colorBackgroundLabel: Color,
  colorBackgroundLabelCurrent: Color,
  colorBackgroundOdd: Color,
  colorBackgroundRowEven: Color,
  colorBackgroundRowOdd: Color,
  colorBackgroundSelection: Color,
  colorBackgroundSelectionCursor: Color,
  colorScrollbackTrack: Color,
  colorScrollbackThumb: Color,
  colorScrollbackThumbHover: Color,
  colorText: Color,
  colorTextColumnEven: Color,
  colorTextColumnOdd: Color,
  colorTextCursor: Color,
  colorTextCursorHighlight: Color,
  colorTextEven: Color,
  colorTextInactiveCursor: Color,
  colorTextInactiveCursorHighlight: Color,
  colorTextInactiveSelection: Color,
  colorTextInactiveSelectionCursor: Color,
  colorTextLabel: Color,
  colorTextLabelCurrent: Color,
  colorTextOdd: Color,
  colorTextRowEven: Color,
  colorTextRowOdd: Color,
  colorTextSelection: Color,
  colorTextSelectionCursor: Color,
  fontFamily: string,
  fontSize: string | number,
  gutterWidth: string | number,
  labelPaddingX: string | number,
  textTransform: string,
};

const hexEditorTheme: HexEditorTheme = {
  asciiPaddingX: 0,
  bytePaddingX: '0.1em',
  separatorBytePaddingX: '0.75em',
  rowPaddingY: '0.1em',
  colorBackground: '#fff',
  colorBackgroundColumnEven: '#fff',
  colorBackgroundColumnOdd: '#f6f8fa',
  colorBackgroundCursor: '#f1f8ff',
  colorBackgroundCursorHighlight: '#c8e1ff',
  colorBackgroundEven: '#fff',
  colorBackgroundInactiveCursor: '#fffbdd',
  colorBackgroundInactiveCursorHighlight: '#fffbdd',
  colorBackgroundInactiveSelection: '#e6ebf1',
  colorBackgroundInactiveSelectionCursor: '#e6ebf1',
  colorBackgroundLabel: '#fff',
  colorBackgroundLabelCurrent: '#fff',
  colorBackgroundOdd: '#f6f8fa',
  colorBackgroundRowEven: '#fff',
  colorBackgroundRowOdd: '#f6f8fa',
  colorBackgroundSelection: '#0366d6',
  colorBackgroundSelectionCursor: '#005cc5',
  colorScrollbackTrack: '#f6f8fa',
  colorScrollbackThumb: '#c6cbd1',
  colorScrollbackThumbHover: '#959da5',
  colorText: '#24292e',
  colorTextColumnEven: '#24292e',
  colorTextColumnOdd: '#24292e',
  colorTextCursor: '#1074e7',
  colorTextCursorHighlight: '#0366d6',
  colorTextEven: '#24292e',
  colorTextInactiveCursor: '#735c0f',
  colorTextInactiveCursorHighlight: '#735c0f',
  colorTextInactiveSelection: '#586069',
  colorTextInactiveSelectionCursor: '#586069',
  colorTextLabel: '#c6cbd1',
  colorTextLabelCurrent: '#676a6c',
  colorTextOdd: '#24292e',
  colorTextRowEven: '#24292e',
  colorTextRowOdd: '#24292e',
  colorTextSelection: '#fff',
  colorTextSelectionCursor: '#fff',
  fontFamily: 'monospace',
  fontSize: '16px',
  gutterWidth: '0.5em',
  cursorBlinkSpeed: '0.5s',
  labelPaddingX: '0.5em',
  scrollWidth: 'auto',
  textTransform: 'uppercase',
};

export default hexEditorTheme;
