const fs = require('fs')
const path = require('path')
const mime = require('mime');
const csv = require('csv-parser');

const csvName = 'po.csv'
const json = 'data.json'
const csvPath = path.join(process.cwd(), 'data', csvName)
const jsonPath = path.join(process.cwd(), 'data', json)

ftppath = '//slcprodftp01/ftp/stance/outbox/archive'

friday = new Date('2019-03-16T12:01:00.000Z')

files = fs.readdirSync(ftppath)

 files = files.map(file => {
  filePath = path.join(ftppath, file)
  fileStat = fs.statSync(filePath)
  return {file, created: fileStat.ctime}
}).filter(f => {
  return f.created > friday
}).map(f => {
  return f.file
})

console.log(files)