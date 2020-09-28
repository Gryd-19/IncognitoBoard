'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var apiRoutes = require('./routes/api.js');


var app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  helmet.dnsPrefetchControl({
    allow: false,
  })
);
app.use(
  helmet.referrerPolicy({
    policy: "origin",
  })
);
//Sample front-end
app.route('/b/:board/')
  .get(function(req, res) {
    res.sendFile(process.cwd() + '/views/board.html');
  });
app.route('/b/:board/:threadid')
  .get(function(req, res) {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function(req, res) {
    let board=req.query["board_name"];
    if(board)res.redirect("/b/"+board);
    res.sendFile(process.cwd() + '/views/index.html');
  });


//Routing for API 
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function() {
  console.log("Listening on port " + process.env.PORT);
});
