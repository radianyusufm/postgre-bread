"use strict"

const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser');
const { Client } = require('pg')
const moment = require('moment');
const connectionString = process.env.DATABASE_URL || 'postgres://radian:1234567@localhost:5432/breaddb';
const client = new Client(connectionString);

client.connect();

app.use(bodyParser.urlencoded({extended : true}))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res)=> {
  let filter = [];
  let isFilter = false;
  if (req.query.cid && req.query.id) {
    filter.push(`id='${parseInt(req.query.id)}'`)
    isFilter = true;
  }if (req.query.cstring && req.query.string) {
    filter.push(`stringdata = '${req.query.string}'`)
    isFilter = true;
  }if (req.query.cinteger && req.query.integer) {
    filter.push(`integerdata = '${Number(req.query.integer)}'`)
    isFilter = true;
  }if (req.query.cfloat && req.query.float) {
    filter.push(`floatdata = '${parseFloat(req.query.float)}'`)
    isFilter = true;
  }if(req.query.cdate && req.query.startdate && req.query.enddate){
    filter.push(`datedata BETWEEN '${req.query.startdate}' AND '${req.query.enddate}'`);
    isFilter = true;
  }if (req.query.cboolean && req.query.boolean) {
    filter.push(`booleandata = '${JSON.parse(req.query.boolean)}'`)
    isFilter = true;
  }
  let sql = 'SELECT count(*) AS total FROM bread'
  if (isFilter) {
    sql +=` WHERE ${filter.join(' AND ')}`
  }
  client.query(sql, (err, data) => {
    if (err) {
      console.error(err)
      return res.send(err);
    }
    let page = Number(req.query.page) || 1
    let limit = 3;
    let offset = (page-1) * 3;
    let total = data.rows[0].total;
    let pages = (total == 0) ? 1 : Math.ceil(total/limit);
    let url = (req.url == "/") ? "/?page=1" : req.url;
    sql = "SELECT * FROM bread";
    if (isFilter) {
      sql += ` WHERE ${filter.join(' AND ')}`
    }
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    client.query(sql, (err, data)=>{
      if (err) {
        console.error(err)
        return res.send(err);
      }

      res.render('list', {title: "BREAD", header: "BREAD", data : data.rows,  pagination: {page: page, limit: limit, offset: offset, pages: pages, total: total, url: url}, query: req.query});

    })
  })
})

app.get('/add', (req, res)=>{
  res.render('add');
})

app.post('/add', (req, res)=>{
  let string = req.body.string;
  let integer = parseInt(req.body.integer);
  let float = parseFloat(req.body.float);
  let date = req.body.date;
  let boolean = req.body.boolean;
  client.query(`INSERT INTO bread(stringdata, integerdata, floatdata, datedata, booleandata) VALUES ('${string}',${integer},${float},'${date}',${boolean})`, (err) =>{
    if (err) {
      console.error(err);
      return res.send(err)
    }
    res.redirect('/');
  })
})

app.get('/edit/:id', (req, res) =>{
  let id = req.params.id;
  client.query(`SELECT * FROM bread WHERE id=${id}`, (err, data)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }if (data.rows.length > 0) {
      console.log( data.rows[0].datedata = moment(data.rows[0].datedata).format("YYYY-MM-DD"))//format html 5 (YYYY-MM-DD)
      res.render('edit', {item : data.rows[0]});
      console.log(data.rows[0]);
    }
  })
})

app.post('/edit/:id', (req, res)=>{
  let id = Number(req.params.id);
  let string = req.body.string;
  let integer = parseInt(req.body.integer);
  let float = parseFloat(req.body.float);
  let date = new Date(req.body.date);
  let boolean =JSON.parse(req.body.boolean);
  console.log(boolean);
  client.query("UPDATE bread SET stringdata=$1, integerdata=$2, floatdata=$3, datedata=$4, booleandata=$5 WHERE id=$6", [string, integer, float, date, boolean, id], (err)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.redirect('/');
  })
})

app.get('/delete/:id', (req, res)=>{
  let id = Number(req.params.id);
  client.query(`DELETE FROM bread WHERE id=${id}`, (err)=>{
    if (err) {
      console.error(err);
      return res.send(err);
    }
    res.redirect('/')
  })
})

app.listen(3000, function(){
  console.log("port");
})
