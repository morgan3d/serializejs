# serializejs
Better serialization to string of JavaScript objects than JSON.

Provides two routines for loading and saving JavaScript values to strings:

    - `serialize(value, transform = undefined) -> string`
    - `deserialize(string, untransform = undefined) -> value`

To use, put:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
<script src="https://morgan3d.github.io/seralizejs/serialize.js"></script>
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

in your code, or download and host locally.

Unlike `JSON.parse` and `JSON.stringify`, this API supports:

    - Special floating point values `Infinity`, `-Infinity`, `NaN`, and `-0`
    - `BigInt`, `Symbol`, and `undefined` 
    - `Date`, `RegExp`, `URL`, `Map`, and `Set`
    - Object and Arrays that may form arbitrary graphs, including cycles
      via a [Structured Cloning](https://developer.mozilla.org/en-US/docs/WebAPI/Web_Workers_API/Structured_clone_algorithm) algorithm
    - TypedArrays (Uint32Array, Int32Array, Uint16Array, Int16Array, Uint8Array, 
      Uint8ClampedArray, Int8Array, Float64Array, Float32Array, Float16Array, 
      BigUint64Array, BigInt64Array)
    - Built-in functions that are top-level or on the `Math` object 
      (e.g., `isFinite`, `Math.cos`)


This API does _not_ support:

    - User-defined functions
    - Built-in functions on objects other than `window` and `Math`
    - Class instances (only plain objects are supported)
    - Object properties defined with Object.defineProperty
    - Objects with prototype inheritance (all objects are 
      deserialized as plain objects)
    - Shared ArrayBuffers. TypedArrays that share an underlying buffer
      are deserialized as separate buffers    

## Transform/Untransform Functions

`transform()` can be used for validation, to throw errors on 
unexpected structures, or to transform objects into a better 
form for serialization. For example, if there are caches 
that should be eliminated, `transform({this_is_a_cache: true, ...})` 
could return `null`. If there is color paletting, then 
`transform({r: 1, g: 0.5, b:0})` could return `{palette_value: 5}`.

If `transform(value) -> value` is provided, then it is run on each 
value *after* cycle detection and *before* serialization. 
`transform()` may return a value with a different type than the input, 
and may mutate its input. It is called once for each value 
encountered in the object graph.

If `untransform(value, type_string) -> value` is provided, then it 
is run on each value *after* deserialization and *before* the value
is returned to the caller. It is called once for each value encountered
in the deserialized object graph.

*WARNING:* Deserialization behavior is undefined if `transform()` or 
`untransform()` returns a different object or array than its input, 
if that object or array is part of a graph with cycles or shared 
references. This can break reference integrity.

## License
Copyright 2025 Morgan McGuire
Licensed under the Open Source MIT License
https://opensource.org/license/mit


## See Also

serialize.js is tiny, lightweight, and handles a lot 
of important cases I've encountered. There are several alternatives
that offer a different feature set (such as speed instead of
comprehensiveness, or better packaging at the expense of simplicity).

- [SuperJSON](https://github.com/flightcontrolhq/superjson) 
- [json-complete](https://github.com/cierelabs/json-complete/) 
- [msgpackr](https://github.com/kriszyp/msgpackr)
- [WorkJSON](https://github.com/morgan3d/workjson) 
