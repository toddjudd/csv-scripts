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
let orderlines = []
let files = []
csvFiles.forEach( file => {
  fs.createReadStream(path.join(csvDir, file))
    .pipe(csv())
    .on('headers', (h) => {
      // console.log(h)
    })
    .on('data', (data) => {
      row = JSON.parse(JSON.stringify(data))
      row.file = file
      // console.log(file)
      if (neededOrders.includes(parseInt(row.SCSCD))) {
      console.log(file)
        orderids.push(row.SCSCD)
        files.push(file)
        orderlines.push(row)
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
    // console.log(files)
    // console.log('orderlines')
    // console.log(orderlines)
    fs.writeFileSync(path.join(outDir, 'orderlines.txt'), removeDups(orderlines))
    lines = orderlines.map(order => {
      console.log('order')
      line = order.DECOL+', '+order.SCSCD+ ', '+order.file
      console.log(line)
      return line
    }).join('\n')
    out = 'material, order, file\n'+ lines
    // out = 'CUNOH, WNOOH, ONH, ONSOH, NMDOH, AD1OH, AD2OH, AD3OH, CITOH, STAOH, ZIPOH, SHIPCSZ, ORDDATE, CYMD, GOMOH, HT1OH, QTDOL, QTOOL, QTDCD, UPC, DECOL, ORDID, STNMXP, STAD1XP, STAD2XP, STCIXP, STSTXP, STZIXP, SOLDCSZ, MDCOH, TXTTX, SORT, SORT1, SCSCD, WARAL, WZNAL, WPSAL, SORT2, QTDAL, QTYAL, CONTAINER, PRICECODE, RPXXP, EXTRETAIL, EXTTAX, EXTSHIP, EXTTOTAL, PERPXP, PEREXP, PATXP, SCTCXP, STCTCXP, SCINX, BOXDESC, PRICN, SOGCN, "BIN#", RHMCX, DLT_SG, DLP_SG '+ lines
    fs.writeFileSync(path.join(outDir, 'orderlines.csv'), out)
    return true
  } else {
    console.log('stream in progress')
    return false
  }
}

