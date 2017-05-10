'user strict';
var db = require('../modules/db');

module.exports.create = (promo_code_type,cb) => {
  console.log('Creating the promo code type!');
  db.query('INSERT INTO promo_code_types SET project_name=?, title=?, promo_code_api_title=?, comment=?',
    [promo_code_type.project_name,promo_code_type.title,promo_code_type.promo_code_api_title,promo_code_type.comment],
    function(error, results, fields) {
      if (error) {cb(error, null); return;}
      cb(null, results);
      console.log('Promo code type created!');
    });
};

module.exports.update = (promo_code_type,cb) => {
  console.log('Updating the promo code type!');
  db.query('UPDATE promo_code_types SET project_name=?, title=?, promo_code_api_title=?, comment=? WHERE promo_code_type_id=?',
    [promo_code_type.project_name,promo_code_type.title,promo_code_type.promo_code_api_title,promo_code_type.comment,promo_code_type.promo_code_type_id],
    function(error, results, fields) {
      if (error) {cb(error, null); return;}
      cb(null, results);
      console.log('Promo code type updated!');
    });
};

module.exports.get = (cb) => {
  console.log('Getting promo code types!');
  db.query('SELECT * FROM promo_code_types',function(error, results, fields) {
    if (error) {cb(error, null); return;}
    cb(null, results);
    console.log('Got promo code types!');
  });
};

module.exports.delete = (promo_code_type_ids,cb) => {
  console.log('Deleting promo code types!');
  db.query('DELETE FROM promo_code_types WHERE promo_code_type_id IN('+promo_code_type_ids.join(',')+')',function(error, results, fields) {
    if (error) {cb(error, null); return;}
    cb(null, results);
    console.log('Promo code types deleted!');
  });
};
