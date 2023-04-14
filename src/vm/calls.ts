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

import { BIG_NEGATIVE_ONE, BIG_ZERO } from "./consts";
import { Vm } from "./vm";

const probe_read = (vm: Vm, to: BigInt, n: BigInt, from: BigInt) => {
    const smallTo = Number(to);
    const smallN = Number(n);
    const smallFrom = Number(from);

    // FIXME: There are currently no access or bounds controls.

    for (let i = 0; i < smallN; i++) {
        vm.memory.all[smallTo + i] = vm.memory.all[smallFrom + i]
    }
    return BigInt(0);
};

const map_lookup_elem = (vm: Vm, bigMapId: BigInt, bigKeyPtr: BigInt) => {
    const [mapId, keyPtr] = [Number(bigMapId), Number(bigKeyPtr)];
    const bigKey = vm.memory.all64[keyPtr / 8];
    const key = Number(bigKey);

    const map = vm.maps.get(mapId);
    if (map === undefined) {
        return BigInt(0);
    }

    const val = map[key];
    if (val === undefined) {
        return BigInt(0);
    }
    return BigInt(val);
};

enum MapUpdateFlags {
    BPF_ANY = 0,
    BPF_NOEXIST = 1,
    BPF_EXIST = 2,
    BPF_F_LOCK = 4,
}

const map_update_elem = (vm: Vm, bigMapId: BigInt, bigKeyPtr: BigInt, bigValuePtr: BigInt, bigFlags: BigInt) => {
    const [mapId, keyPtr, valuePtr, flags] = [bigMapId, bigKeyPtr, bigValuePtr, bigFlags].map(Number);
    const map = vm.maps.get(mapId);
    if (map === undefined) {
        console.warn(`map_update_elem called for non-existent map ${mapId}`);
        return BIG_NEGATIVE_ONE;
    }
    
    const bigKey = vm.memory.all64[keyPtr / 8];
    const key = Number(bigKey);
    const bigValue = vm.memory.all64[valuePtr / 8];
    const value = Number(bigValue);

    if ((flags & MapUpdateFlags.BPF_EXIST) && map[key] === undefined) {
        console.warn(`map_update_elem called with BPF_EXIST for non-existent key ${key}`);
        return BIG_NEGATIVE_ONE;
    }
    if ((flags & MapUpdateFlags.BPF_NOEXIST) && map[key] !== undefined) {
        console.warn(`map_update_elem called with BPF_NOEXIST for existent key ${key}`);
        return BIG_NEGATIVE_ONE;
    }
    map[key] = value;
    return BIG_ZERO;
};

const callbacks = new Array(64);
callbacks[1] = map_lookup_elem;
callbacks[2] = map_update_elem;
callbacks[4] = probe_read;
// callbacks[6] is trace_printk and handled specially (see vm.ts)

export default callbacks;
