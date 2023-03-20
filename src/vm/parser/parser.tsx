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
import { Parser } from '../../generated/ebpf-assembler';
import { InstructionOpMode } from '../consts';

export interface ParsedInstruction {
    opname: string;
    lineNumber: number;
    source: string;
    dest: string;
    offset: number;
    imm: bigint;
    label?: string;
    extension?: string;
}

export type ParsedLabels = {[label: string]: number};

interface ParseResult {
    instructions: ParsedInstruction[];
    labels: ParsedLabels;
}

export const parse = (prog: string): ParseResult => {
    const p = new Parser();
    p.yy = {
        labels: {},
        current: {},
        instructions: [],
        InstructionOpMode: InstructionOpMode,
        currentLine: 1,
    };
    p.parse(prog);
    return {
        instructions: p.yy.instructions,
        labels: p.yy.labels,
    };
};
