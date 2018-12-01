const args = require('args')
const csv = require('csv-parser');
const fs = require('fs')
const mime = require('mime');
const moment = require('moment')
const path = require('path')
const sql = require('mssql')
const vars = require('./vars')

let db02 = vars.db02
let csvDir = vars.csvDir
const outDir = path.join(process.cwd(), 'data')
let removeDups = (names) => names.filter((v,i) => names.indexOf(v) === i)

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
  // console.log(file)
  let valid = true
  // console.log(`valid ${valid}`)
  // console.log(`flags.f ${flags.f}`)
  if (flags.f) {
    // console.log(`flags.f == file.filename ${flags.f == file.filename}`)
    if (flags.f != file.filename) {valid = false}
  } 
  // console.log(`valid ${valid}`)
  // console.log(`flags.s ${flags.s}`)
  if (flags.s) {
    // console.log(`moment(flags.s).isSameOrBefore(file.stats.ctime) ${moment(flags.s).isSameOrBefore(file.stats.ctime)}`)
    if (!moment(flags.s).isSameOrBefore(file.stats.ctime)) {valid = false}
  } 
  // console.log(`valid ${valid}`)
  // console.log(`flags.e ${flags.e}`)
  if (flags.e) {
    // console.log(`moment(flags.e).isSameOrAfter(file.stats.ctime) ${moment(flags.e).isSameOrAfter(file.stats.ctime)}`)
    if (!moment(flags.e).isSameOrAfter(file.stats.ctime)) {valid = false}
  } 
  // console.log(`valid ${valid}`)
  return valid
})

console.log(csvFiles)