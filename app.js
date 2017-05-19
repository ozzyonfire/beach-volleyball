var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

app.listen(process.env.PORT || 8000, function() {
	console.log("Beach Volleyball serving at 8000");
});

require('./app/routes.js')(app);