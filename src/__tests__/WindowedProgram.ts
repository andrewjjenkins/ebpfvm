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
import { getAnnotations } from '../WindowedProgram';
import { assemble } from '../vm/program';

const expectGetsAnnotations = (line: string, expected: any) => {
    return () => {
        const p = assemble([line, "mov r1, 41"], {});
        expect(p.instructions.length).toEqual(1);
        const annotations = getAnnotations(p.instructions);
        expect(annotations).toMatchObject(expected);
    };
};

it(
    "gets annotations",
    expectGetsAnnotations("// foo: bar", { foo: "bar"}),
);

it(
    "gets multiple annotations",
    expectGetsAnnotations(
        "// foo: bar baz: bad",
        { foo: "bar", baz: "bad"}
    ),
);

it(
    "gets annotations with no space",
    expectGetsAnnotations(
        "// foo:bar baz: bad",
        { foo: "bar", baz: "bad"}
    ),
);

it(
    "rejects invalid (trailing)",
    expectGetsAnnotations(
        "// foo: bar baz: bad this is extra",
        {},
    ),
);

it(
    "rejects invalid (leading)",
    expectGetsAnnotations(
        "// this is extra foo: bar",
        {},
    ),
);

it(
    "rejects invalid (multiple spaces)",
    expectGetsAnnotations(
        "// foo:   bar",
        {},
    ),
);
