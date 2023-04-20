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
import { FunctionComponent as FC, useCallback, useMemo, useRef } from "react";
import { Box, Typography } from "@mui/material";
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

const codeStyle = {
    fontFamily: "Monospace",
    margin: "1px",
};

const programCounterStyle = {
    ...codeStyle,
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

interface ProgramTableProps {
    columns: ColumnDef<DisplayedInstruction>[];
    data: DisplayedInstruction[];
}

const renderHeader = (header: Header<DisplayedInstruction, unknown>) => {
    return (
        <th
            key={header.id}
            colSpan={header.colSpan}
            style={{ width: header.getSize() }}
        >
            {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
            )}
        </th>
    );
};

const renderRow = (row: Row<DisplayedInstruction>) => {
    const { programCounter, source, inst } = row.original;

    return (
        <tr key={row.id}>
            <td>
                <Box sx={{ py: 0, px: 0.5, verticalAlign: "bottom" }}>
                    <Typography component="pre" sx={programCounterStyle}>
                        {programCounter}
                    </Typography>
                </Box>
            </td>
            <td>
                <Box sx={{ py: 0, px: 0.5, verticalAlign: "bottom" }}>
                    <Typography component="pre" sx={codeStyle}>
                        {source}
                    </Typography>
                </Box>
            </td>
            <td>
                <Box sx={{ py: 0, px: 0.5, verticalAlign: "bottom" }}>
                    <Typography component="pre" sx={codeStyle}>
                        {inst}
                    </Typography>
                </Box>
            </td>
        </tr>
    );
};


const ProgramTable: FC<ProgramTableProps> = ({ columns, data }) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        debugTable: true,
    });

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const { rows } = table.getRowModel();
    const rowVirtualizer = useVirtual({
        parentRef: tableContainerRef,
        estimateSize: useCallback((index: number) => 24, []),
        size: data.length,
        overscan: 10,
    });
    const { virtualItems: virtualRows, totalSize } = rowVirtualizer;

    let paddingTop: JSX.Element | null = null;
    let paddingBottom: JSX.Element | null = null;
    if (virtualRows.length > 0) {
        const firstRow = virtualRows[0];
        const lastRow = virtualRows[virtualRows.length - 1];
        if (firstRow.start && firstRow.start > 0) {
            paddingTop = (<tr>
                <td style={{ height: `${firstRow.start}px`}} />
            </tr>);
        }
        if (lastRow.end && lastRow.end > 0) {
            paddingBottom = (<tr>
                <td style={{ height: `${totalSize} - ${lastRow.end}px`}} />
            </tr>);
        }
    }
    if (paddingTop || paddingBottom) {
    }
    
    const renderVirtualRow = (virtualRow: VirtualItem) => {
        const row = rows[virtualRow.index] as Row<DisplayedInstruction>;
        return renderRow(row);
    };

    return (
        <div className="p-2">
            <div className="h-2" />
            <div ref={tableContainerRef} style={{height: 500, overflow: "auto" }}className="container">
                <table>
                    <thead style={{ position: "sticky", top: 0, background: "lightgray"}}>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(renderHeader)}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {paddingTop}
                        {virtualRows.map(renderVirtualRow)}
                        {paddingBottom}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const WindowedProgram: FC<WindowedProgramProps> = (props) => {
    const instructions = props.program.instructions;
    const numInstructions = instructions.length;
    const annotations = getAnnotations(instructions);

    const data = useMemo<DisplayedInstruction[]>(() => {
        let address = 0;
        const data: DisplayedInstruction[] = [];

        for (let i = 0; i < numInstructions; i++) {
            const active = props.programCounter * 8 === address;
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

            const programCounter = address / 8;

            data.push({
                programCounter,
                address,
                source,
                inst,
                active,
            });

            address += instructions[i].machineCode.byteLength;
        }
        return data;
    }, [instructions, numInstructions, annotations]);

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
            { annotations.entryPoint &&
                <Typography variant="subtitle1">Runs on <strong>{annotations.entryPoint}</strong>:</Typography>
            }
            <ProgramTable columns={columns} data={data} />
        </Box>
    );
};
