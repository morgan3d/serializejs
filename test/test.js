"use strict";

{
    const d = new Date();
    console.log(d);
    console.assert(deserialize(serialize(d)).toString() === d.toString(), "Date"); 
}

{
    const a = -0;
    const b = deserialize(serialize(a));
    console.log(a);
    console.assert(b === 0 && 1 / b === -Infinity, "-0"); 
}

{
    for (let test of [
        true,
        false,
        0,
        3,
        3.1415,
        null,
        {x: 5, y: 3},
        [true, 1, 7],
        "Hello World"]) {

        console.log(test);
        console.assert(JSON.stringify(deserialize(serialize(test))) === JSON.stringify(test), "simple"); 
    }
}

{
    const a = Symbol.for('hello');
    const b = deserialize(serialize(a));
    console.log(a);
    console.assert(typeof b === 'symbol');
    console.assert(b.toString() === a.toString());
}

{
    const a = {loop: null};
    a.loop = a;
    const b = deserialize(serialize(a));
    console.log(a);
    console.assert(b.loop === b);
}
