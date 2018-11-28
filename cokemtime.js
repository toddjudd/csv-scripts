const fs = require('fs')
const path = require('path')
const mime = require('mime');
const csv = require('csv-parser');
const sql = require('mssql')
const args = process.argv.slice(2);
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

const startdate = new Date('2018-11-24T14:52:21.999Z')
const enddate = new Date('2018-11-24T14:52:21.999Z')

csvFiles = csvFiles.map(file => {
  console.log(dates.compare(fs.statSync(path.join(csvDir, file)).atime.getTime(), startdate.getTime()))
})

if (argFile) {
  csvFiles = [argFile]
}

let i = 0
let ftpOrderIds = []
csvFiles.forEach( file => {
  fs.createReadStream(path.join(csvDir, file))
    .pipe(csv())
    .on('headers', (h) => {
      // console.log(h)
    })
    .on('data', (data) => {
      // console.log(data)
      row = JSON.parse(JSON.stringify(data))
      ftpOrderIds.push(row.SCSCD)
    })
    .on('end', function() {
      i++
      handleStreamEnd(i)
    })
})

function handleStreamEnd(i) {
  if (csvFiles.length == i) {
    console.log("stream done")
    return true
  } else {
    console.log('stream in progress')
    return false
  }
}

const pool = new sql.ConnectionPool(db02).connect().then(pool => {
  return pool.query`select orderId from linxapi.dbo.order_import_header where ownerid = 'cokem'`
}).then(results => {
  linxapiOrderIds = results.recordset.map(id => {
    return id.orderId
  })
  ftpOrderIds = removeDups(ftpOrderIds)
  console.log(linxapiOrderIds)
  console.log(ftpOrderIds)
  fs.writeFileSync(path.join(outDir, 'linxapiOrderIds.txt'), linxapiOrderIds)
  fs.writeFileSync(path.join(outDir, 'ftpOrderIds.txt'), ftpOrderIds)
  var set = new Set(linxapiOrderIds)
  diff = [...new Set([...ftpOrderIds].filter(x => !set.has(x)))]
  console.log(diff)
  fs.writeFileSync(path.join(outDir, 'diff.txt'), diff)
  closePool()
  return true
}).catch(err => {
  console.log(err)
  return false
})

function closePool() {
  process.exit()
}