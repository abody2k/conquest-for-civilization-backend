export let units = [


    {
        hp:100,
        p:500, // price
        pow:50
    },
    
];


export function makeUnit(position,unitIndex,unitOwner) {

    const unit = units[unitIndex];
    unit.pos = position;
    unit.o = unitOwner;
    return unit;
    
}