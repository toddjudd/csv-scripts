const fs = require('fs')
const path = require('path')
const mime = require('mime');
const csv = require('csv-parser');
const sql = require('mssql')
const args = process.argv.slice(2);
const neededOrders = require('./src/ordersToFind')
let removeDups = (names) => names.filter((v,i) => names.indexOf(v) === i)

const vars = require('./vars')
const db02 = vars.db02
const csvDir = vars.csvDir
const outDir = path.join(process.cwd(), 'data')

let argFile = false
if (args.indexOf('-f')>=0) {
  argFile = args[args.indexOf('-f')+1] 
}

let csvFiles = fs.readdirSync(csvDir)

if (argFile) {
  csvFiles = [argFile]
}

let i = 0
let orderids = []
let files = []
csvFiles.forEach( file => {
  fs.createReadStream(path.join(csvDir, file))
    .pipe(csv())
    .on('headers', (h) => {
      // console.log(h)
    })
    .on('data', (data) => {
      row = JSON.parse(JSON.stringify(data))
      // console.log(file)
      if (neededOrders.includes(parseInt(row.SCSCD))) {
      console.log(file)
        orderids.push(row.SCSCD)
        files.push(file)
      }
    })
    .on('end', function() {
      i++
      handleStreamEnd(i)
    })
})

function handleStreamEnd(i) {
  if (csvFiles.length == i) {
    console.log("stream done")
    console.log(files)
    fs.writeFileSync(path.join(outDir, 'files.txt'), removeDups(files))
    return true
  } else {
    console.log('stream in progress')
    return false
  }
}