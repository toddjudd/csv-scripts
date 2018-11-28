const fs = require('fs')
const path = require('path')
const mime = require('mime');
const csv = require('csv-parser');
const sql = require('mssql')
const moment = require('moment')
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
      ftpOrderIds.push({orderid: row.SCSCD, fileName: file, ftpCreateDate: moment(fs.statSync(path.join(csvDir, file)).atime).format('D/M/YY H:m')})
    })
    .on('end', function() {
      i++
      handleStreamEnd(i)
    })
})

function handleStreamEnd(i) {
  if (csvFiles.length == i) {
    console.log("stream done")
    fs.writeFileSync(path.join(outDir, 'ftptimes.json'), JSON.stringify(ftpOrderIds))
    return true
  } else {
    console.log('stream in progress')
    return false
  }
}

let enlinxdata = []

const pool = new sql.ConnectionPool(db02).connect().then(pool => {
  return pool.query`
    WITH orderProcessing AS (
    SELECT t.orderId, t.createdSysDateTime processedDate
    FROM FootPrint.datex_footprint.Tasks t
    WHERE t.operationCodeId = 8
    GROUP BY t.orderId, t.createdSysDateTime
    )
    SELECT h.OrderID, h.ImportStatus, h.createdSysDateTime createdLinxAPI, o.createdSysDateTime createdFootprint, os.name orderStatus, op.processedDate, s.shippedDate orderCompleted
    FROM LinxAPI.dbo.ORDER_IMPORT_HEADER h
    LEFT JOIN FootPrint.datex_footprint.Orders o ON h.OrderID = o.ownerReference AND o.projectId = 164 AND h.id =  o.externalLabel
    LEFT JOIN FootPrint.datex_footprint.OrderStatuses os ON o.orderStatusId = os.id
    LEFT JOIN FootPrint.datex_footprint.ShipmentOrderLookup sol ON o.id = sol.orderId
    LEFT JOIN FootPrint.datex_footprint.Shipments s ON sol.shipmentId = s.id
    LEFT JOIN orderProcessing op ON o.id = op.orderId
    WHERE h.OwnerID = 'Cokem'
  `
}).then(results => {
  enlinxdata = results.recordset
  console.log(enlinxdata)
  enlinxdata = enlinxdata.map(row => {
    return `${row.OrderID},${row.ImportStatus},${moment(row.createdLinxAPI).format('D/M/YY H:m')},${moment(row.createdFootprint).format('D/M/YY H:m')},${row.orderStatus},${moment(row.processedDate).format('D/M/YY H:m')},${row.orderComplet}`
  }).join('\n')
  enlinxdata = 'OrderID,ImportStatus,createdLinxAPI,createdFootprint,orderStatus,processedDate,orderCompleted,\n' + enlinxdata
  fs.writeFileSync(path.join(outDir, 'enlinxdata.csv'), enlinxdata)
  nextStep()
  return true
}).catch(err => {
  console.log(err)
  return false
})

function nextStep() {

  //ftpOrderIds
  //enlinxdata

  f = ftpOrderIds.map(row => {
    // console.log(row)
    return `${row.orderid}, ${row.fileName}, ${row.ftpCreateDate}`
  }).join('\n')

  f = 'orderid, fileName, ftpCreateDate\n'+f

  fs.writeFileSync(path.join(outDir, 'ftpOrderInfo.csv'), f)

  // f = ftpOrderIds.find(row => {
  //   console.log(row)
  //   row.orderid == '29357560'
  // })
  // console.log(f)

  // e = enlinxdata.find(row => {
  //   // console.log(row.OrderID)
  //   // console.log(typeof row.OrderID)
  //   row.OrderID === '29418510'
  // })
  // console.log(e)

  // result = ftpOrderIds.map(ftp => {
  //   match = enlinxdata.find(ed => {
  //     // console.log(ftp)
  //     console.log(typeof ed.OrderID)
  //     console.log(typeof ftp.orderid)
  //     // console.log(ed.OrderID == ftp.orderid)
  //     ed.OrderID == ftp.orderid
  //   })
  //   if (!match) {
  //     match = {}
  //   }    
  //   console.log(match)
  //   ftp.ImportStatus = match.ImportStatus
  //   ftp.createdLinxAPI = match.createdLinxAPI
  //   ftp.createdFootprint = match.createdFootprint
  //   ftp.orderStatus = match.orderStatus
  //   ftp.processedDate = match.processedDate
  //   ftp.orderCompleted = match.orderCompleted
  //   return ftp
  // })

  // Extract resulting combined objects from the Map as an Array
  // console.log(result)
  // fs.writeFileSync(path.join(csvDir, 'alldata.json'), JSON.stringify(result))

  // process.exit()
}
// const accPool = new sql.ConnectionPool(process.env.SQLCON).connect().then(accPool => {
//       return accPool.query`
//         SELECT DISTINCT name
//         FROM datex_footprint.OperationCodes
//         WHERE (operationTypeId = 15)
//         ORDER BY name 
//       `;
//     }).then(opCodes => {
//       res.render('accessorialForm', {title: `Add Accessorials`, opCodes, accessorialMessage: req.accessorialMessage, nav: h.nav.shipping})
//     }).catch(err => {
//       console.error(err);
//       res.render('error', {message: err, status: '500', nav: h.nav.shipping})    
//     })



// csvFiles.forEach(file => {
//   filePath = path.join(csvDir, file)
//   // console.log(filePath)
//   fs.createReadStream(filePath)
//     .pipe(csv())
//     .on('headers', (h) => {
//       // console.log(h)
//     })
//     .on('data', (data) => {
//       row = JSON.parse(JSON.stringify(data))
//       // console.log(file)
//       if (neededOrders.includes(parseInt(row.SCSCD))) {
//       console.log(file)
//         orderids.push(row.SCSCD)
//         files.push(file)
//       }
//     })
//     .on('end', function() {
//       fs.writeFileSync(orderidsfile, orderids)
//       console.log(x(files))
//     })
// })


