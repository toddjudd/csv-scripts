const args = require('args')
const csv = require('csv-parser');
const fs = require('fs')
const mime = require('mime');
const moment = require('moment')
const path = require('path')
const sql = require('mssql')
const vars = require('./vars')

let nidavellir = vars.nidavellir
let csvDir = vars.csvDir
const outDir = path.join(process.cwd(), 'data')
let removeDups = (names) => names.filter((v,i) => names.indexOf(v) === i)
function removeDuplicates(myArr, prop) {
  return myArr.filter((obj, pos, arr) => {
    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
  });
}
var i = 0

args
  .option('file', 'Single file time in Archive DIR to check against LinxAPI', 'false')
  .option('startTime', 'Starting time to decide what the oldest file to check should be  YYYY-M-D H:M:S', 'false')
  .option('endTime', 'Ending time to decide what the newest file to check should be  YYYY-M-D H:M:S', 'false')
  .option('directory', 'Overide directory to search for CSVs', 'false')

const flags = args.parse(process.argv)
if (flags.s == 'false') {flags.s = false}
if (flags.startTime == 'false') {flags.startTime = false}
if (flags.e == 'false') {flags.e = false}
if (flags.endTime == 'false') {flags.endTime = false}
if (flags.f == 'false') {flags.f = false}
if (flags.file == 'false') {flags.file = false}
if (flags.d == 'false') {flags.d = false}
if (flags.directory == 'false') {flags.directory = false}
console.log(flags)

if (!moment(flags.s, "YYYY-MM-DD H:m:s").isValid() && flags.s) {
  console.log("The Start Date supplied is not a valid date.\nSupply a date following \x1b[36mYYYY-M-D H:M:S\x1b[36m")
  process.exit()
}
if (!moment(flags.e, "YYYY-MM-DD H:m:s").isValid() && flags.e) {
  console.log("The End Date supplied is not a valid date.\nSupply a date following \x1b[36mYYYY-M-D H:M:S\x1b[36m")
  process.exit()
}
if (flags.d) {csvDir = flags.d}
if (flags.f) {
  if (!flags.f.match(/.+\.csv/i)) {
    console.log("The file supplied is not a vlaid .csv\nSupply supply a file that matches \x1b[33m<filename>\x1b[33m\x1b[36m.csv\x1b[36m")  
  }
}

csvFiles = fs.readdirSync(csvDir).map(file => {
  return {
    filename: file,
    filepath: path.join(csvDir, file),
    stats: fs.statSync(path.join(csvDir, file))
  }
}).filter(file => {
  let valid = true
  if (flags.f) {
    if (flags.f != file.filename) {valid = false}
  } 
  if (flags.s) {
    if (!moment(flags.s).isSameOrBefore(file.stats.ctime)) {valid = false}
  } 
  if (flags.e) {
    if (!moment(flags.e).isSameOrAfter(file.stats.ctime)) {valid = false}
  } 
  return valid
})

async function getRecords() {
  try {
    await sql.connect(nidavellir)
    const res = await sql.query`select orderId from linxapi.dbo.order_import_header where ownerid = 'cokem' and importstatus <> 'x' and ownerid = 'cokem'`
    sql.close()
    let records = res.recordset.map(rec => {
      return rec.orderId
    })
    console.log(records)
    console.log(csvFiles)
    compareFilesNOrders(records, csvFiles)
  } catch (err) {
    console.log(err)
    process.end()
  }
} 
getRecords()

function compareFilesNOrders(rec, files) {
  filesWithOrdersNotInRec = []
  files.forEach(file => {
    fs.createReadStream(file.filepath)
      .pipe(csv())
      .on('headers', (h) => {
        // console.log(h)
      })
      .on('data', (data) => {
        row = JSON.parse(JSON.stringify(data))
        if (rec.indexOf(row.SCSCD)<0) {
          file.missingOrders =[]
          file.missingOrders.push(row.SCSCD)
            // row.SCSCD
          filesWithOrdersNotInRec.push(file)
        }
      })
      .on('end', function() {
        i++
        handleStreamEnd(i)
      })
  })
}

function handleStreamEnd(i) {
    if (csvFiles.length == i) {
    console.log("stream done")
    console.log("filesWithOrdersNotInRec")
    console.log(filesWithOrdersNotInRec)
    return true
  } else {
    console.log('stream in progress')
    return false
  }
}