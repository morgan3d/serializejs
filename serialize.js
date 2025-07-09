"use strict";
/* 
See https://github.com/morgan3d/serializejs for documentation
and the latest version.

Copyright 2025 Morgan McGuire
Licensed under the Open Source MIT License
https://opensource.org/license/mit
*/

/* Exported functions */
let serialize, deserialize;

{
/* Maps the name to the underlying type */
const typedArrayTrait = {
    Uint32Array: {
        construct: Uint32Array,
        decode: parseInt},

    Int32Array: {
        construct: Int32Array,
        decode: parseInt},

    Uint16Array: {
        construct: Uint16Array,
        decode: parseInt},

    Int16Array: {
        construct: Int16Array,
        decode: parseInt},

    Uint8Array: {
        construct: Uint8Array,
        decode: parseInt},

    Uint8ClampedArray: {
        construct: Uint8ClampedArray,
        decode: parseInt},

    Int8Array: {
        construct: Int8Array,
        decode: parseInt},

    Float64Array: {
        construct: Float64Array,
        decode: parseFloat},

    Float32Array: {
        construct: Float32Array,
        decode: parseFloat},
    
    BigUint64Array: {
        construct: BigUint64Array,
        decode: BigInt},

    BigInt64Array: {
        construct: BigInt64Array,
        decode: BigInt}
};

/* Handles -0 float correctly */
function serializeNumber(f) {
    if (f === 0 && 1 / f === -Infinity) {
        return "-0";
    } else {
        return f.toString();
    }
}

deserialize = function deserialize(str, untransform) {
    return decode(JSON.parse(str), [], untransform);
}

serialize = function serialize(value, transform) {
    return JSON.stringify(encode(value, new Map(), transform));
}

function decode(enc, memory, untransform) {
    let result;

    switch (enc.type) {
    case 'undefined':
        result = undefined;
        break;

    case 'null':
        result = null;
        break;

    case 'boolean':
        result = (enc.value === 'true');
        break;

    case 'string':
        result = enc.value;
        break;

    case 'number':
        result = parseFloat(enc.value);
        break;

    case 'bigint':
        result = BigInt(enc.value);
        break;

    case 'symbol':
        result = Symbol.for(enc.value);
        break;

    case 'Array':
    case 'object':
        result = enc.type === 'array' ? new Array(enc.value.length) : new Object();
        memory.push(result);
        for (const i in enc.value) {
            result[i] = decode(enc.value[i], memory, untransform);
        }
        break;

    case 'Set':
        result = new Set();
        memory.push(result);
        for (const element of enc.value) {
            result.add(decode(element, memory, untransform));
        }
        break;

    case 'Map':
        result = new Map();
        memory.push(result);
        for (let i = 0; i < enc.value.key.length; ++i) {
            result.set(
                decode(enc.value.key[i], memory, untransform),
                decode(enc.value.value[i], memory, untransform));
        }
        break;

    case 'Date':
        result = new Date(enc.value);
        break;

    case 'URL':
        result = new URL(enc.value);
        break;
    
    case 'RegExp':
        {
            const m = enc.value.match(/\/(.*)\/(.*)?/);
            result = new RegExp(m[1], m[2] || "");
            break;
        }

    case 'Uint32Array':
    case 'Int32Array':
    case 'Uint16Array':
    case 'Int16Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int8Array':
    case 'Float64Array':
    case 'Float32Array':
    case 'BigUint64Array':
    case 'BigInt64Array':
        {
            const trait = typedArrayTrait[enc.type];
            result = trait.construct(enc.value.length);
            memory.push(result);
            for (let i = 0; i < enc.value.length; ++i) {
                result[i] = trait.decode(enc.value[i]);
            }
        }
        break;

    case 'function': 
        {
            const name = enc.value.split('.');
            if (name[0] === 'Math') {
                result = Math[name[1]];
            } else {
                result = window[name[1]];
            }
        }
        break;

    case 'reference':
        // Do not transform!
        return memory[enc.index];
    }

    if (untransform) {
        result = untransform(result);
    }

    return result;
}


const supportedBuiltInClasses = new Set([Map, Date, Set, RegExp, URL]);


function encode(value, memoryMap = new Map(), transform) {
    // Store the original object for memoizing
    const memoizeValue = value;

    if (transform) {
        value = transform(value);
    }

    // Switch on the post-transform type
    let type = typeof value;
    if (type === 'object') {
        if (Array.isArray(value)) {
            type = 'Array';
        } else if (typedArrayTrait[value.constructor.name] || supportedBuiltinClasses.contains(value.constructor)) {
            type = value.constructor.name;
        }
    }

    switch (type) {
    case 'undefined':
    case 'null':
        return {type: type, value: type};

    case 'number':
        return {type: type, value: serializeNumber(value)};

    case 'boolean':
    case 'string':
    case 'bigint':
        return {type: type, value: value.toString()};

    case 'symbol':
        return {type: type, value: value.description};

    case 'Date':
    case 'RegExp':
    case 'URL':
        return {type: type, value: value.toString()};
    
    case 'Uint32Array':
    case 'Int32Array':
    case 'Uint16Array':
    case 'Int16Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int8Array':
    case 'Float64Array':
    case 'Float32Array':
    case 'BigUint64Array':
    case 'BigInt64Array':
    case 'object':
    case 'Array':
    case 'Set':
    case 'Map':
        {
            const i = memoryMap.get(memoizeValue);
            if (i === undefined) {
                // Never saw this object before; serialize it.
                // First update the memory map so that we know
                // how to reach it again.
                memoryMap.set(memoizeValue, memoryMap.size());

                const dst = {type: type};
                if (type.endsWith('Array') && type !== 'Array') {
                    // TypedArrays
                    dst.arraytype = value.constructor.name;
                    dst.value = new Array(value.length);

                    if (dst.arraytype.startsWith('Float')) {
                        // Be careful with -0
                        for (let k = 0; k < value.length; ++k) {
                            dst.value[k] = serializeNumber(value[k]);                            
                        }
                    } else {
                        for (let k = 0; k < value.length; ++k) {
                            dst.value[k] = value[k].toString();
                        }
                    }
                } else if (type === 'Map') {
                    dst.value = {key: new Array(), value: newArray()};
                    for (const [k, v] of value) {
                        dst.value.push(encode(key, memoryMap, transform), encode(value, memoryMap, transform));
                    }
                } else if (type === 'Set') {
                    dst.value = new Array();
                    for (const element of value) {
                        dst.value.push(encode(element, memoryMap, transform));
                    }
                } else {
                    // Object and array
                    dst.value = (type !== 'object') ? 
                            new Array(value.length) :
                            new Object();

                    for (const k of Object.keys(value)) {
                        dst.value[k] = encode(value[k], memoryMap, transform);
                    }
                }

                return dst;
            } else {
                // When deserializing, replace this with the ith object
                // that was deserialized.
                return {type: 'reference', index: i}
            }
        }

    case 'function':
        if (/\[native code\]\s*\}\s*$/.test(value.toString())) {
            // Built-in, see if it is on the window or Math object
            if (window[value.name] === value) {
                return {type: 'function', value: 'window.' + value.name};
            } else if (Math[value.name] === value) {
                return {type: 'function', value: 'Math.' + value.name};
            } else {
                throw 'Cannot serialize function ' + value.name;
            }
        } else {
            throw 'Cannot serialize a user function';
        }
    }
}

}
