import React, {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useReducer,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

import {
  AutoSizeHexEditorProps,
  HexEditorHandle,
} from '../types';

import CLASS_NAMES from '../constants/classNames';
import INLINE_STYLES, { MEASURE_STYLE } from '../constants/inlineStyles';
import { formatHex } from '../utils';

import HexEditor from './HexEditor';
import HexEditorMeasureRow from './HexEditorMeasureRow';

interface AutoSizeHexEditorState {
  asciiWidth: number,
  byteWidth: number,
  separatorByteWidth: number,
  columns: number,
  gutterWidth: number,
  labelWidth: number,
  rowHeight: number,
  rows: number,
  scrollbarWidth: number,
};

interface AutoSizeHexEditorAction {
  asciiWidth?: number,
  byteWidth?: number,
  separatorByteWidth?: number,
  columns?: number,
  gutterWidth?: number,
  labelWidth?: number,
  rowHeight?: number,
  rows?: number,
  scrollbarWidth?: number,
};

const reducer = (
  prevState: AutoSizeHexEditorState,
  mergeState: AutoSizeHexEditorAction,
) => ({ ...prevState, ...mergeState });

const AutoSizeHexEditor: React.RefForwardingComponent<HexEditorHandle, AutoSizeHexEditorProps> = ({
  asciiPlaceholder,
  asciiWidth: explicitAsciiWidth,
  byteWidth: explicitByteWidth,
  separatorByteWidth: explicitSeparatorByteWidth,
  classNames = CLASS_NAMES,
  columns: explicitColumns,
  gutterWidth: explicitGutterWidth,
  height: explicitHeight,
  inlineStyles = INLINE_STYLES,
  labelWidth: explicitLabelWidth,
  measureStyle = MEASURE_STYLE,
  rowHeight: explicitRowHeight,
  rows: explicitRows,
  scrollbarWidth: explicitScrollbarWidth,
  width: explicitWidth,
  ...props
}, ref) => {
  const [state, setState] = useReducer(reducer, {
    asciiWidth: explicitAsciiWidth || 10,
    byteWidth: explicitByteWidth || 20,
    separatorByteWidth: explicitSeparatorByteWidth || 15,
    columns: explicitColumns || 0x10,
    gutterWidth: explicitGutterWidth || 0,
    labelWidth: explicitLabelWidth || 80,
    rowHeight: explicitRowHeight || 20,
    rows: explicitRows || 0x10,
    scrollbarWidth: explicitScrollbarWidth || 0,
  });

  const handleMeasure = useCallback(({
    asciiWidth,
    byteWidth,
    separatorByteWidth,
    gutterWidth,
    labelWidth,
    rowHeight,
    scrollbarWidth,
  }: {
    asciiWidth: number,
    byteWidth: number,
    separatorByteWidth: number,
    gutterWidth: number,
    labelWidth: number,
    rowHeight: number,
    scrollbarWidth: number,
  }) => {
    setState({
      asciiWidth: explicitAsciiWidth == null ? asciiWidth : explicitAsciiWidth,
      byteWidth: explicitByteWidth == null ? byteWidth : explicitByteWidth,
      separatorByteWidth: explicitSeparatorByteWidth == null ? separatorByteWidth : explicitSeparatorByteWidth,
      gutterWidth: explicitGutterWidth == null? gutterWidth : explicitGutterWidth,
      labelWidth: explicitLabelWidth == null ? labelWidth : explicitLabelWidth,
      rowHeight: explicitRowHeight == null ? rowHeight : explicitRowHeight,
      scrollbarWidth: explicitScrollbarWidth == null ? scrollbarWidth : explicitScrollbarWidth,
    });
  }, [
    explicitAsciiWidth,
    explicitByteWidth,
    explicitSeparatorByteWidth,
    explicitGutterWidth,
    explicitLabelWidth,
    explicitRowHeight,
    explicitScrollbarWidth,
  ]);

  const formatOffset = useMemo(() => {
    const padToLength = 2 * Math.ceil(formatHex(Math.max(0, props.data.length - 1)).length / 2);
    return (offset: number) => formatHex(offset, padToLength);
  }, [props.data.length]);

  const measureStyles = useMemo(() => ({
    ascii: { ...measureStyle, ...inlineStyles.ascii },
    byte: { ...measureStyle, ...inlineStyles.byte },
    gutter: { ...measureStyle, ...inlineStyles.gutter },
    offsetLabel: { ...measureStyle, ...inlineStyles.offsetLabel },
  }), [inlineStyles, measureStyle]);

  return (
    <>
      <HexEditorMeasureRow
        asciiPlaceholder={asciiPlaceholder}
        asciiValue={0x41}
        asciiWidth={explicitAsciiWidth}
        byteWidth={explicitByteWidth}
        separatorByteWidth={explicitSeparatorByteWidth}
        className={props.className}
        classNames={classNames}
        formatOffset={formatOffset}
        formatValue={props.formatValue}
        gutterWidth={explicitGutterWidth}
        labelWidth={explicitLabelWidth}
        offset={props.data.length}
        onMeasure={handleMeasure}
        style={measureStyle}
        styles={measureStyles}
        value={0x00}
      />
      <AutoSizer
        disableWidth={explicitWidth != null || explicitColumns != null}
        disableHeight={explicitHeight != null || explicitRows != null}
      >
        {({ width: autoSizerWidth, height: autoSizerHeight }) => {
          // Horizontal
          let width = explicitWidth == null ? autoSizerWidth : explicitWidth;
          let columns = explicitColumns;
          if (columns != null && width == null) {
            // Calculate width from the columns and component measurements
            width = state.scrollbarWidth;
            if (props.showRowLabels) {
              width += state.labelWidth + state.gutterWidth;
            }
            width += columns * state.byteWidth;
            const separatorByteExtraWidth =
              Math.max(0, (state.byteWidth - state.separatorByteWidth));
            width += Math.floor(columns / 8) * separatorByteExtraWidth;
            if (props.showAscii) {
              width += (columns * state.asciiWidth) + state.gutterWidth;
            }
            width = Math.ceil(width);
          } else if (width != null) {
            // Determine the number of columns using the width
            let remainingWidth = width - state.scrollbarWidth;
            if (props.showRowLabels) {
              remainingWidth -= state.labelWidth + state.gutterWidth;
            }
            if (props.showAscii) {
              remainingWidth -= state.gutterWidth;
            }
            const columnMinimumWidth = props.showAscii
              ? state.asciiWidth + state.byteWidth
              : state.byteWidth;
            columns = Math.max(1, Math.floor(remainingWidth / columnMinimumWidth));
          } else {
            console.warn('Horizontal size inference failed!');
            columns = 1;
          }

          // Vertical
          let height = explicitHeight == null ? autoSizerHeight : explicitHeight;
          let rows = explicitRows;
          const rowHeight = explicitRowHeight == null ? state.rowHeight : explicitRowHeight;
          if (rows != null && height == null) {
            // Calculate height from the columns and component measurements
            height = rows * rowHeight;
            if (props.showColumnLabels) {
              height += rowHeight;
            }
            height = Math.ceil(height);
          } else if (height != null) {
            // Determine the number of rows using the height
            rows = Math.max(1, height && rowHeight && Math.floor(height / rowHeight));
            if (rows && props.showColumnLabels) {
              rows -= 1;
            }
          } else {
            console.warn('Vertical size inference failed!');
            rows = 1;
          }

          return (
            <HexEditor
              asciiPlaceholder={asciiPlaceholder}
              classNames={classNames}
              columns={columns}
              height={height}
              inlineStyles={inlineStyles}
              ref={ref}
              rowHeight={rowHeight}
              rows={rows}
              width={width}
              {...props}
              style={{
                ...props.style,
                width,
                height,
              }}
            />
          );
        }}
      </AutoSizer>
    </>
  );
};

AutoSizeHexEditor.displayName = 'AutoSizeHexEditor';

export default memo(forwardRef(AutoSizeHexEditor));
