var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var app = express();
app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

// prepare DB
var uriString = process.env.MONGODB_URI || 
                process.env.MONGOHQ_URL ||
                'mongodb://localhost/db';

mongoose.connect(uriString, function (err, res) {
  if (err) {
    console.log('Error connecting to: ' + uriString + '. ' + err);
  } else {
    console.log('Successfully connected to: ' + uriString);
  }
});

app.listen(process.env.PORT || 8000, function() {
	console.log("Beach Volleyball serving at 8000");
});

require('./app/routes.js')(app);