/*
 * Copyright 2023 Andrew Jenkins <andrewjjenkins@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { FunctionComponent as FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Table,
    TableContainer,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Box,
    Typography,
} from "@mui/material";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    Row,
    useReactTable,
    Header,
} from "@tanstack/react-table";
import { AssembledProgram, Instruction } from "./vm/program";
import { VirtualItem, useVirtual } from "react-virtual";
import hexEditorTheme from "./hex-editor/themes";

const codeStyle = {
    fontFamily: "Monospace",
    margin: "1px",
};

const programCounterStyle = {
    ...codeStyle,
    textAlign: "right",
    color: "lightgray",
};

const programCounterActiveStyle = {
    ...programCounterStyle,
    color: "black",
};

const headerStyle = {
    padding: "2px",
    color: hexEditorTheme.colorTextLabelCurrent,
};

const headerProgramCounterStyle = {
    ...headerStyle,
    px: 1.6,
    textAlign: "right",
};

// If the first line of the program is a comment that contains
// annotations, extract them.
export const getAnnotations = (instructions: Instruction[]) => {
    if (
        instructions.length === 0 ||
        instructions[0].asmSource.slice(0, 2) !== "//"
    ) {
        return {};
    }

    const annotations: { [annotation: string]: string } = {};
    let firstLine = instructions[0].asmSource.split("\n")[0].slice(2).trim();
    while (firstLine !== "") {
        const matches = /^(\S+): ?(\S+)/.exec(firstLine);
        if (matches === null) {
            // The format of this line is invalid.
            return {};
        }
        annotations[matches[1]] = matches[2];

        // Chop off this match and any whitespace.
        firstLine = firstLine.slice(matches[0].length).trimStart();
    }
    return annotations;
};

interface WindowedProgramProps {
    programCounter: number;
    program: AssembledProgram;
}

interface DisplayedInstruction {
    programCounter: number;
    address: number;
    source: string;
    inst: string;
    active: boolean;
}

const renderHeader = (header: Header<DisplayedInstruction, unknown>) => {
    const style =
        header.id === "programCounter"
            ? headerProgramCounterStyle
            : headerStyle;
    return (
        <TableCell key={header.id} colSpan={header.colSpan} sx={style}>
            {flexRender(header.column.columnDef.header, header.getContext())}
        </TableCell>
    );
};

const renderRow = (
    row: Row<DisplayedInstruction>,
    virtualKey: number | string
) => {
    const { active, programCounter, source, inst } = row.original;
    const pcStyle = active ? programCounterActiveStyle : programCounterStyle;

    return (
        <TableRow key={virtualKey} selected={active}>
            <TableCell style={{ padding: 2, verticalAlign: "top" }}>
                <Box sx={{ py: 0, px: 1.5 }}>
                    <Typography component="pre" sx={pcStyle}>
                        {programCounter}
                    </Typography>
                </Box>
            </TableCell>
            <TableCell style={{ padding: 2, verticalAlign: "top" }}>
                <Box sx={{ py: 0, px: 0.5 }}>
                    <Typography component="pre" sx={codeStyle}>
                        {source}
                    </Typography>
                </Box>
            </TableCell>
            <TableCell style={{ padding: 2, verticalAlign: "top" }}>
                <Box sx={{ py: 0, px: 0.5 }}>
                    <Typography component="pre" sx={codeStyle}>
                        {inst}
                    </Typography>
                </Box>
            </TableCell>
        </TableRow>
    );
};

const countLines = (s: string) => {
    return 1 + (s.match(/\n/g) || []).length;
};

const LINE_HEIGHT_ESTIMATE = 24; //pixels
const BOX_PADDING_ESTIMATE = 7; //pixels

interface ProgramTableProps {
    columns: ColumnDef<DisplayedInstruction>[];
    data: DisplayedInstruction[];
    hotIndex: number;
}

const ProgramTable: FC<ProgramTableProps> = (props: ProgramTableProps) => {
    const { columns, data, hotIndex } = props;
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        debugTable: true,
    });

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const { rows } = table.getRowModel();
    const [ focused, setFocused ] = useState(0);

    const estimateSize = useCallback(
        (index: number) => {
            const { source, inst } = rows[index].original;
            const sourceLines = countLines(source);
            const instLines = countLines(inst);
            const maxLines = sourceLines > instLines ? sourceLines : instLines;
            return maxLines * LINE_HEIGHT_ESTIMATE + BOX_PADDING_ESTIMATE;
        },
        [rows]
    );

    const rowVirtualizer = useVirtual({
        parentRef: tableContainerRef,
        estimateSize,
        size: data.length,
        overscan: 10,
    });
    const { virtualItems: virtualRows, totalSize } = rowVirtualizer;

    useEffect(() => {
        if (hotIndex !== -1 && focused !== hotIndex) {
            rowVirtualizer.scrollToIndex(hotIndex, {align: "center"});
            setFocused(hotIndex);
        }
    }, [hotIndex, focused, setFocused])


    let paddingTop: JSX.Element | null = null;
    let paddingBottom: JSX.Element | null = null;
    if (virtualRows.length > 0) {
        const firstRow = virtualRows[0];
        const lastRow = virtualRows[virtualRows.length - 1];
        if (firstRow.start && firstRow.start > 0) {
            paddingTop = (
                <tr>
                    <td style={{ height: `${firstRow.start}px` }} />
                </tr>
            );
        }
        if (lastRow.end && lastRow.end > 0) {
            paddingBottom = (
                <tr>
                    <td style={{ height: `${totalSize} - ${lastRow.end}px` }} />
                </tr>
            );
        }
    }
    if (paddingTop || paddingBottom) {
    }

    const renderVirtualRow = (virtualRow: VirtualItem) => {
        const row = rows[virtualRow.index] as Row<DisplayedInstruction>;
        return renderRow(row, virtualRow.key);
    };

    return (
        <TableContainer
            ref={tableContainerRef}
            style={{ height: 300, overflow: "auto" }}
        >
            <Table>
                <TableHead
                    style={{
                        position: "sticky",
                        top: 0,
                        background: "white",
                    }}
                >
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(renderHeader)}
                        </tr>
                    ))}
                </TableHead>
                <TableBody>
                    {paddingTop}
                    {virtualRows.map(renderVirtualRow)}
                    {paddingBottom}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export const WindowedProgram: FC<WindowedProgramProps> = (props) => {
    const instructions = props.program.instructions;
    const programCounter = props.programCounter;
    const numInstructions = instructions.length;
    const annotations = getAnnotations(instructions);

    let hotIndex = -1;

    const data = useMemo<DisplayedInstruction[]>(() => {
        let address = 0;
        const data: DisplayedInstruction[] = [];

        for (let i = 0; i < numInstructions; i++) {
            const active = programCounter * 8 === address;
            if (active) {
                hotIndex = i;
            }
            let inst = "";
            for (let j = 0; j < instructions[i].machineCode.byteLength; j++) {
                if (j === 8) {
                    inst += "\n";
                }
                inst += instructions[i].machineCode[j]
                    .toString(16)
                    .padStart(2, "0");
            }

            // If the first line is annotations, we hide it in this view.
            let source = instructions[i].asmSource;
            if (i === 0 && Object.keys(annotations).length !== 0) {
                source = source.split("\n").slice(1).join("\n");
            }

            data.push({
                programCounter: (address / 8),
                address,
                source,
                inst,
                active,
            });

            address += instructions[i].machineCode.byteLength;
        }
        return data;
    }, [instructions, numInstructions, annotations, programCounter]);

    const columns = useMemo<ColumnDef<DisplayedInstruction>[]>(
        () => [
            {
                header: "PC",
                accessorKey: "programCounter",
                size: 75,
            },
            {
                header: "Source",
                accessorKey: "source",
                size: 100,
            },
            {
                header: "Machine Code",
                accessorKey: "inst",
                size: 100,
            },
        ],
        []
    );

    return (
        <Box>
            {annotations.entryPoint && (
                <Typography variant="subtitle1">
                    Runs on <strong>{annotations.entryPoint}</strong>:
                </Typography>
            )}
            <ProgramTable columns={columns} data={data} hotIndex={hotIndex} />
        </Box>
    );
};
