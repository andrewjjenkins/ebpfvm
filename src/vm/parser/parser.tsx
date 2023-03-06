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
import { Parser } from '../../generated/ebpf';
import { OperandsModes } from './consts';

export interface ParsedInstruction {
    mode: OperandsModes;
    opcode: string;
    lineNumber: number;
    k?: number;
    register?: string;
    true?: string;
    false?: string;
    extension?: string;
}

export type ParsedLabels = {[label: string]: number};

interface ParseResult {
    instructions: ParsedInstruction[];
    labels: ParsedLabels;
}

export const parse = (prog: string): ParseResult => {
    const p = new Parser();
    p. yy = {
        labels: {},
        current: {},
        instructions: [],
        OperandsModes: OperandsModes,
        currentLine: 1,
    };
    const out = p.parse(prog);
    return {
        instructions: p.yy.instructions,
        labels: p.yy.labels,
    };
};
