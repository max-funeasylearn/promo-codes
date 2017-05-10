'user strict';
var db = require('../modules/db');

module.exports.getProjectNames = (cb) => {
  console.log('Getting project names!');
  db.query('SELECT project_name FROM promo_code_types GROUP BY project_name ORDER BY project_name ASC',function(error,results,fields){
    if(error !== null){
      cb('Could not get project names', null); return;
    }

    console.log('Got project names!');
    cb(null,results.map(function(obj){return obj.project_name;}));
  });
};
