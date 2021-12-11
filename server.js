const express = require("express");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// Iさんのコードでは、
// const MongoClient = require('mongodb').MongoClient;
// で MongoClient を定義していましたが、削除のときに ObjectID も使いたいので、こうしています。
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const mongouri = 'mongodb+srv://'+process.env.USER+':'+process.env.PASS+'@'+process.env.MONGOHOST;

app.use(express.static("public"));



// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

//ページ遷移
app.get("/input", (request, response) => {
  response.sendFile(__dirname + "/views/regist.html");
});

app.get("/input2", (request, response) => {
  response.sendFile(__dirname + "/views/direct.html");
});

app.post('/find', function(req, res){
    let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
   req.on('end', function() {
    const search_theme = JSON.parse(received).search_theme;
    MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colDishes = db.collection('questions'); // 対象コレクション
      
      var condition = {theme: search_theme}; // 検索条件
      
      if (search_theme == "すべて"){
        condition={};
      };
      colDishes.find(condition).toArray(function(err, questions) {
        console.log(questions);
        res.json(questions);
        client.close();
      });
    });
  });
});

app.post('/pick', function(req, res){
    let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
   req.on('end', function() {
    const selectTheme = JSON.parse(received);
    console.log(selectTheme)
    MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colDishes = db.collection('questions'); // 対象コレクション
      
      var condition = selectTheme; // 検索条件
      
      if (selectTheme.theme == "すべて"){
        condition={};
      };
      colDishes.aggregate([{$match:condition},{$sample:{size:1}}//1件
        ]).toArray(function(err, questions) {
        res.json(questions);//配列だが要素は１
        client.close();
      });
    });
  });
});

app.post('/save', function(req, res){
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  req.on('end', function() {
  const questions = JSON.parse(received); // 保存対象
  MongoClient.connect(mongouri, function(error, client) {
    const db = client.db(process.env.DB); // 対象 DB
    const colQuestions = db.collection('questions'); // 対象コレクション
    colQuestions.insertOne(questions, function(err, result) {
      res.sendStatus(200); // HTTP ステータスコード返却
       client.close(); // DB を閉じる
     });
   });
  });
});

app.post('/remove', function(req, res){
  let received = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    received += chunk;
  });
  req.on('end', function() {
    const del_questions = JSON.parse(received); // 保存対象

    const oid = new mongodb.ObjectID(del_questions.id);

    const condition = {_id: {$eq: oid}};
    console.log(condition);
    MongoClient.connect(mongouri, function(error, client) {
      const db = client.db(process.env.DB); // 対象 DB
      const colQuestions = db.collection('questions'); // 対象コレクション

      colQuestions.deleteMany(condition, function(err, result) {
        res.sendStatus(200); // HTTP ステータスコード返却
        client.close(); // DB を閉じるconsole.log(del_questions)
        console.log(result);
       });
     });
    });
});