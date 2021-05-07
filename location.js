const fs = require('fs');

let warehouse = 'W2';
let locations = [];
let regex = new RegExp(/W2(A[A-G][0-6][0-9]|L[A-K]0[1-5]|[M-N][A-Z]0[1-5])[A-D][1-2]/gim);
const pad = (num, places) => String(num).padStart(places, '0');

for (let major = 1; major < 26; major++) {
  for (let minor = 1; minor < 26; minor++) {
    aisle = String.fromCharCode(major + 64) + String.fromCharCode(minor + 64);
    for (let b = 1; b < 60; b++) {
      bay = pad(b, 2);
      for (let t = 1; t < 5; t++) {
        tier = String.fromCharCode(t + 64);
        for (let pos = 1; pos < 3; pos++) {
          position = `${pos}`;
          locations.push({
            humanReadable: `${warehouse} ${aisle} ${bay} ${tier} ${position}`,
            scannable: `${warehouse}${aisle}${bay}${tier}${position}`,
            aisle,
            bay,
            tier,
            position,
            pickPathModifier: major + minor + b + t + pos,
            img: `C:\\Users\\ironman\\Desktop\\svgtopng\\${tier}${position}.png`,
          });
        }
      }
    }
  }
}

header = `humanReadable,scannable,aisle,bay,tier,position,pickPathModifier,img\n`;

data = locations
  .filter((loc) => {
    return loc.scannable.match(regex);
  })
  .map((loc) => {
    return `${loc.humanReadable},${loc.scannable},${loc.aisle},${loc.bay},${loc.tier},${loc.position},${loc.pickPathModifier},${loc.img}`;
  })
  .join('\n');

fs.writeFileSync('./wh2locations.csv', header + data);

console.log(data);
