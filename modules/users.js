'user strict';
var db = require('../modules/db');

module.exports.create = (user,cb) => {
  console.log('Creating the user!!');

  db.query('INSERT INTO users SET username=?, password=?, firstname=?, lastname=?, user_type=?, status=?, promocodes_limit=?',
    [user.username,user.password,user.firstname,user.lastname,user.user_type,user.status,user.promocodes_limit], function (error, results, fields) {
    if (error) {cb(error, null); return;}
    console.log('User successfully created');
    cb(null, 'success');
  });
//  db_connection.end();
};

module.exports.update = (user,cb) => {
  console.log('Updating user!');

  db.query('UPDATE users SET username=?, password=?, firstname=?, lastname=?, user_type=?, status=?, promocodes_limit=? WHERE user_id=?',
    [user.username,user.password,user.firstname,user.lastname,user.user_type,user.status,user.promocodes_limit,user.user_id], function (error, results, fields) {
    if (error) {cb(error, null); return;}
    console.log('User successfully updated');
    cb(null, 'success');
  });
};

module.exports.get = (cb) => {
  console.log('Getting users!');
  db.query('SELECT * FROM users',function(error, results, fields) {
    if (error) {cb(error, null); return;}
    cb(null, results);
    console.log('Got users!');
  });
}

module.exports.getActiveByUsername = (username,select,cb) => {
  console.log('Getting user by username!');
  db.query('SELECT '+select+' FROM users WHERE username=? AND status=1',[username],function (error, results, fields) {
    if (error) {cb(error, null); return;}
    console.log('Got user!');
    cb(null, results[0]);
  });
}

module.exports.getById = (user_id,cb) => {
  console.log('Getting user by user_id!');
  db.query('SELECT * FROM users WHERE user_id=?',[user_id],function (error, results, fields) {
    if (error) {cb(error, null); return;}
    console.log('Got user!');
    cb(null, results[0]);
  });
}

module.exports.delete = (user_ids,cb) => {
  console.log('Deleting user!');

  db.query('DELETE FROM promo_codes WHERE user_id IN('+user_ids.join(',')+')',function(error, results, fields) {
    if (error) {console.log(error);cb(error, null); return;}

    db.query('DELETE FROM users WHERE user_id IN('+user_ids.join(',')+')',function(error, results, fields) {
      if (error) {console.log(error);cb(error, null); return;}
      cb(null, 'success');
        console.log('User successfully deleted!');
    });
  });
}
