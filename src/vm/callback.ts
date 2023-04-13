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

// emscripten doesn't directly support bigint.  If you have C code that
// wants to pass 64-bit types (uint64_t or similar) to Javascript, you
// can use the function signature character "j", but in Javascript-land,
// it looks like two "numbers" (from 32-bit integers).
//
// For instance:
//   emscriptenMod.addFunction(f, "vij")
// means that "f"'s call signature will look like this:
//   f(number arg0, number arg1_low, number arg1_high)
// (and it returns void, because the first character is 'v')
// This function will convert arg1_low and arg1_high into one Biguint
// before calling your callback:
//  emscriptenMod.addFunction(bigintTrampoline(f, "vij"), "vij")
// gets a call:
//  f(number arg0, Biguint arg1)
export const bigintTrampoline = (f: (...args: any[])=>any, signature: string) => {
    function trampoline() {
        // We don't care about return type.
        // FIXME: Can we convert bigint into two numbers for return?
        signature = signature.slice(1);

        debugger;

        const callArgs = [];
        var sigIndex = 0, argsIndex = 0;
        for ( ; (argsIndex < arguments.length) && (sigIndex < signature.length); ) {
            if (signature[sigIndex] === "j") {
                if (argsIndex + 1 >= arguments.length) {
                    throw new Error("Not enough args");
                }
                var bigArg = BigInt(arguments[argsIndex + 1]) << BigInt(32);
                bigArg |= BigInt(arguments[argsIndex]);
                callArgs.push(bigArg);
                argsIndex += 2;
                sigIndex += 1;
            } else {
                callArgs.push(arguments[argsIndex]);
                argsIndex += 1;
                sigIndex += 1;
            }
        }
        if (argsIndex !== arguments.length) {
            throw new Error("Unused args");
        }
        if (sigIndex !== signature.length) {
            throw new Error("Signature too long");
        }
        return f(...callArgs);
    }
    return trampoline as (...args: any[])=>any;
};
