'user strict';
var mysql = require('mysql');

connection = mysql.createConnection({
  multipleStatements: true,
  host     : '---',
  user     : '---',
  password : '---',
  database : 'promo_codes',
  port: 3306,
  timeout: 60000
});

var del = connection._protocol._delegateError;
connection._protocol._delegateError = function(err, sequence){
  if (err.fatal) {
    console.trace('fatal error: ' + err.message);
  }
  return del.call(this, err, sequence);
};

connection.connect(function(err) {
  if(err !== null)
    console.log(err); // 'ECONNREFUSED'
});

module.exports = connection
