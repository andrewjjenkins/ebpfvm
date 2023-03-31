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
import { ParsedInstruction, ParsedLabels } from "./parser/parser";

export interface ResolvedInstruction {
    opname: string;
    lineNumber: number;
    source: string,
    dest: string,
    offset: number,
    imm: bigint,
    label?: number;
    extension?: number;
}

export const resolveJumpOffset = (instIndex: number, absTarget: number) => {
    if (instIndex >= absTarget) {
        throw new Error(`only forward jumps allowed`);
    }
    // subtract 1: you are always jumping at least one instruction
    return absTarget - instIndex - 1;
};

export const resolve = (
    instructions: ParsedInstruction[],
    labels: ParsedLabels,
    symbols: {[key: string]: number},
    helpers: string[],
) => {
    const resolvedInstructions: ResolvedInstruction[] = [];

    for (let i = 0; i < instructions.length; i++) {
        const inst = instructions[i];

        const resolvedInst: ResolvedInstruction = {
            opname: inst.opname,
            lineNumber: inst.lineNumber,
            imm: (inst.imm === undefined) ? BigInt(0) : inst.imm,
            source: inst.source,
            dest: inst.dest,
            offset: inst.offset,
        };

        if (!inst.imm && inst.opname === "call") {
            if (!inst.label) {
                throw new Error(
                    `call instruction without function (line ${inst.lineNumber})`
                );
            }
            const id = helpers.indexOf(inst.label);
            if (id === -1) {
                throw new Error(
                    `call unknown function ${inst.label} (line ${inst.lineNumber})`
                );
            }
            resolvedInst.imm = BigInt(id);
        }

        // FIXME: Recalculate imm and offset here based on symbols.
        if (inst.extension !== undefined) {
            const absSymbol: number = symbols[inst.extension];
            if (absSymbol === undefined) {
                throw new Error(
                    `label "${inst.extension}" undefined (line ${inst.lineNumber})`
                );
            }
            resolvedInst.extension = absSymbol;
        }

        resolvedInstructions.push(resolvedInst);
    }

    return resolvedInstructions;
};
