const fs = require('fs')
const path = require('path')
const mime = require('mime');
const csv = require('csv-parser');

const csvName = 'po.csv'
const json = 'data.json'
const csvPath = path.join(process.cwd(), 'data', csvName)
const jsonPath = path.join(process.cwd(), 'data', json)

let content = {
  rows: []
}

var mimetype = mime.getType(csvPath);
if (mimetype !== 'text/csv') {
  console.log('error: file not CSV')
  return false
}

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('headers', (h) => {
    content.headers = h
    if (   h[0] !== 'Sku'
        && h[1] !== 'Upc'
        && h[2] !== 'Description'
        && h[3] !== 'HTC Code'
        && h[4] !== 'Country of Origin'
        && h[5] !== 'Price'
        && h[6] !== 'Length'
        && h[7] !== 'Width'
        && h[8] !== 'Height'
        && h[9] !== 'Weight'
        && h[10] !== 'Volume' ) {
      content.err = true
      content.errMsg = 'Headers are not correct'
    }
  })
  .on('data', (data) => {
    content.rows.push(JSON.parse(JSON.stringify(data)))
  })
  .on('end',function(){
    fs.writeFileSync(jsonPath, JSON.stringify(content));

    if (content.err) {
      console.log(content.errMsg)
      console.log(content.headers)
      return false
    }
    console.log(content.rows)
    return true
  });