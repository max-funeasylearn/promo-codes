'user strict';
var db = require('../modules/db');

module.exports.get = (cb) => {
  db.query('SELECT * FROM settings',function(error, results, fields) {
    if (error) {cb(error, null); return;}
    cb(null, results);
  });
};

module.exports.save = (settings,cb) => {
  console.log('Saving settings!');
  if(settings.length==0) {cb('Settings not given', null);return;}
  if(isNaN(settings[0].value) || parseInt(settings[0].value) > 100) {cb('Wrong promo codes length', null);return;}

  var queries = [];

  for(i in settings)
    queries.push('UPDATE settings SET value='+db.escape(settings[i].value)+' WHERE setting_id='+db.escape(settings[i].setting_id));
  db.query(queries.join('; '),function(error, results, fields){
    console.log(results);
    console.log('Settings saved!');
    cb(null, results);
  });
}
