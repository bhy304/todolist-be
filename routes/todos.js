const express = require('express')
const router = express.Router()
const connection = require('../mariadb')


router.use(express.json())

// DB 연동 테스트
connection.query('SELECT * FROM `todos`', (err, results, fields) => {
  console.log(results)
})

module.exports = router
