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
import { OperandsModes } from './parser/consts';

export interface ResolvedInstruction {
    mode: OperandsModes;
    opcode: string;
    lineNumber: number;
    k?: number;
    register?: string;
    true?: number;
    false?: number;
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
) => {
    const resolvedInstructions: ResolvedInstruction[] = [];

    for (let i = 0; i < instructions.length; i++) {
        const inst = instructions[i];

        const resolvedInst: ResolvedInstruction = {
            mode: inst.mode,
            opcode: inst.opcode,
            lineNumber: inst.lineNumber,
        };

        if (inst.k !== undefined) {
            resolvedInst.k = inst.k;
        }

        if (inst.register !== undefined) {
            // FIXME: Should we resolve this here?  eBPF
            resolvedInst.register = inst.register;
        }

        if (inst.true !== undefined) {
            const absTarget = labels[inst.true];
            if (absTarget === undefined) {
                throw new Error(
                    `label "${inst.true}" undefined (line ${inst.lineNumber})`
                );
            }
            resolvedInst.true = resolveJumpOffset(i, absTarget);
        }

        if (inst.false !== undefined) {
            const absTarget = labels[inst.false];
            if (absTarget === undefined) {
                throw new Error(
                    `label "${inst.false}" undefined (line ${inst.lineNumber})`
                );
            }
            resolvedInst.false = resolveJumpOffset(i, absTarget);
        }

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
