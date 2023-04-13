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

import { bigintTrampoline } from "../callback";

it("trampolines non-64-bit", () => {
    const f = jest.fn();
    const t = bigintTrampoline(f, "vifd");
    t(42, 1.5, 3.5);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenLastCalledWith(42, 1.5, 3.5);
});

it("trampolines 64-bit", () => {
    const f = jest.fn();
    const t = bigintTrampoline(f, "vijifd");
    t(39, 42, 0, 45, 1.5, 3.5);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenLastCalledWith(39, BigInt(42), 45, 1.5, 3.5);
});

it("trampolines big 64-bit", () => {
    const f = jest.fn();
    const t = bigintTrampoline(f, "vijd");
    const largeInt = BigInt("9876543210");
    const largeIntHigh = (largeInt >> BigInt(32));
    const largeIntLow = (largeInt & BigInt("0xffffffff"));
    t(39, largeIntLow, largeIntHigh, 3.5);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenLastCalledWith(39, largeInt, 3.5);
});

it("rejects too-few args", () => {
    const f = jest.fn();
    const t = bigintTrampoline(f, "vij");
    expect(() => {t(39);}).toThrowError();
    expect(f).toHaveBeenCalledTimes(0);
});

it("rejects too-many args", () => {
    const f = jest.fn();
    const t = bigintTrampoline(f, "vij");
    expect(() => {t(39, 0, 42, 4.0);}).toThrowError();
    expect(f).toHaveBeenCalledTimes(0);
});
