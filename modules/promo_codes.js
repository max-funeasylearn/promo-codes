'user strict';
var db = require('../modules/db');
var fs = require('fs');
var settings = require('../modules/settings');
var users = require('../modules/users');

module.exports.create = (promo_code,user_id,cb) => {
  console.log('creating promo code!')

  console.log('getting number of letters for new promo code');
  settings.get(function(error,results){
    if(error !== null){
      cb('Could not get settings',null);
    }else {
      console.log('got number of letters for new promo code');

      var promo_code_str = generatePromoCodeStr(results[0].value);
      db.query('INSERT INTO promo_codes SET user_id=?, promo_code_type_id=?, promo_code=?, value=?, date_created=NOW(), valid=?, used=?',
        [user_id,promo_code.promo_code_type_id,promo_code_str,promo_code.value,1,0],
        function(error, results, fields) {
          if (error) {cb('Could not create promo code', null); return;}
          console.log('promo code created!');
          results = {promo_code_id: results.insertId,promo_code_str: promo_code_str};
          cb(null, results);
        }
      );
    }
  });
};

module.exports.createBulk = (promo_codes,user_id,cb) => {
  console.log('bulk creating promo codes!');

  console.log('getting number of letters for new promo code');
  settings.get(function(error,results){
    if(error !== null){
      cb('Could not get settings',null);
    }else {
      console.log('got number of letters for new promo code');

      fs.writeFile('shared/export.txt', '', (err) => {
        if (err) console.log(err);
      });

      var inserts = [];
      var promo_codes_arr = [];
      for(var i=0; i<promo_codes.number_of_codes;i++){
        var promo_code_str = generatePromoCodeStr(results[0].value);
        promo_codes_arr.push(promo_code_str);
        inserts.push('('+user_id+','+promo_codes.promo_code_type_id+',"'+promo_code_str+'",'+db.escape(promo_codes.value)+',NOW(),1,0)');
      }

      db.query('INSERT INTO promo_codes(user_id,promo_code_type_id,promo_code,value,date_created,valid,used) VALUES '+inserts.join(','),function(error, results, fields){
        if (error) {console.log(error);cb('Could not bulk create promo codes', null); return;}

        fs.writeFile('shared/export.txt', promo_codes_arr.join('\n'), (err) => {
          if (err) console.log(err);
          cb(null, {'success':'1'})
        });
      })
    }
  });
};

module.exports.update = (promo_code,cb) => {
  console.log('Updating the promo code!');
  db.query('UPDATE promo_codes SET promo_code_type_id=?, promo_code=?, value=?, valid=?, used=? WHERE promo_code_id=?',
    [promo_code.promo_code_type_id,promo_code.promo_code,promo_code.value,promo_code.valid,promo_code.used,promo_code.promo_code_id],
    function(error, results, fields) {
      if (error) {cb(error, null); return;}
      cb(null, results);
      console.log('Promo code updated!');
    });
};

module.exports.get = (args,cb) => {
  console.log('Getting promo codes!');

  var pagination = {
    page: 1,
    items_per_page: (typeof args.items_per_page != 'undefined' && args.items_per_page == 0? 0: 100)
  }
  var sort = {
    by: 'promo_code_id',
    direction: 'DESC'
  }

  pagination.page = parseInt(args.page);

  switch(args.by){
    case 'promo_code_id':
      sort.by = 'promo_code_id';
      break;
    case 'username':
      sort.by = 'users.username';
      break;
    case 'project_name':
      sort.by = 'promo_code_types.project_name';
      break;
    case 'type':
      sort.by = 'promo_code_types.title';
      break;
    case 'promo_code':
      sort.by = 'promo_code';
      break;
    case 'value':
      sort.by = 'value';
      break;
    case 'date_created':
      sort.by = 'date_created';
      break;
    case 'valid':
      sort.by = 'valid';
      break;
    case 'used':
      sort.by = 'used';
      break;
  }

  switch(args.direction){
    case 'ASC':
      sort.direction = 'ASC';
      break;
    case 'DESC':
      sort.direction = 'DESC';
      break;
  }

  var filter ='';
  if(typeof args.filter_by != 'undefined'){
    filter = args.filter_by.map(function(field,i){
      if(field == 'promo_code_type') field='promo_code_types.title';
      return connection.escapeId(field)+' = '+connection.escape(args.filter_value[i]);
    }).join(' AND ');
    filter = ' AND '+filter;
  }

  db.query('SELECT promo_codes.*,\
                  users.username,\
                  promo_code_types.project_name,\
                  promo_code_types.title AS type,\
                  promo_code_types.promo_code_type_id,\
                  promo_code_types.project_name,\
                  promo_code_types.comment AS promo_code_type_comment\
            FROM promo_codes\
            INNER JOIN users ON users.user_id = promo_codes.user_id\
            INNER JOIN promo_code_types ON promo_code_types.promo_code_type_id = promo_codes.promo_code_type_id\
            WHERE 1=1\
            '+(typeof args.user_id != 'undefined'?' AND promo_codes.user_id='+parseInt(args.user_id):'')+'\
            '+(typeof args.today != 'undefined'?' AND DATE_FORMAT(date_created,"%Y-%m-%d")=DATE_FORMAT(NOW(),"%Y-%m-%d")':'')+
            filter+'\
             ORDER BY '+sort.by+' '+sort.direction+
            (pagination.items_per_page != 0?' LIMIT '+(pagination.page-1)*pagination.items_per_page+', '+pagination.items_per_page:''),
            function(error, results, fields) {
              if (error) {console.log(error),cb(error, null); return;}
              if(pagination.items_per_page != 0){
                db.query('SELECT count(*) AS cnt FROM promo_codes\
                        INNER JOIN users ON users.user_id = promo_codes.user_id\
                        INNER JOIN promo_code_types ON promo_code_types.promo_code_type_id = promo_codes.promo_code_type_id\
                        WHERE 1=1 '+
                (typeof args.user_id != 'undefined'?' AND promo_codes.user_id='+parseInt(args.user_id):'') + filter,function(error2,results2,fields) {
                  if (error2) {console.log(error2),cb(error2, null); return;}

                  if(pagination.items_per_page != 0)
                    cb(null, {results:results,total_pages:Math.ceil(results2[0].cnt/pagination.items_per_page)});
                  console.log('Got promo codes!');

                });
              }else
                cb(null, results);
            });
};

module.exports.getByPromoCode = (promo_code, cb) => {
  console.log('Getting sigle promo code!');

  db.query('SELECT promo_codes.*, promo_code_types.promo_code_api_title \
                  FROM promo_codes \
                  INNER JOIN promo_code_types ON promo_code_types.promo_code_type_id = promo_codes.promo_code_type_id\
                  WHERE promo_code=?',[promo_code],function(error, results, fields){
    if (error) {console.log('Could not get promo code'),cb(error, null); return;}

    if(results.length > 0){
      console.log('Got promo code!');
      cb(null,results[0]);
    }else
      cb('Promo code not found',null);
  });
};

module.exports.setUsed = (promo_code, cb) => {
  console.log('Setting promo code '+promo_code+' as used');

  db.query('UPDATE promo_codes SET used=1 WHERE promo_code=?',[promo_code],function(error, results, fields){
    if (error) {console.log(error),cb('Could not set promo code '+promo_code+' as used', null); return;}
    console.log('Set promo code '+promo_code+' as used');
    cb(null,results);
  });
};

module.exports.delete = (promo_code_ids,cb) => {
  console.log('Deleting promo codes!');
  db.query('DELETE FROM promo_codes WHERE promo_code_id IN('+promo_code_ids.join(',')+')',function(error, results, fields) {
    if (error) {cb(error, null); return;}
    cb(null, results);
    console.log('Promo codes deleted!');
  });
};

module.exports.mark_as_not_valid = (promo_code_ids,cb) => {
  console.log('Marking promo codes as not valid!');
  db.query('UPDATE promo_codes SET valid=0 WHERE promo_code_id IN('+promo_code_ids.join(',')+')',function(error, results, fields) {
    if (error) {cb(error, null); return;}
    cb(null, results);
    console.log('Marked promo codes as not valid!');
  });
};

var generatePromoCodeStr = (letters_cnt) => {
  var letters = [];
  for(i=0;i<letters_cnt;i++)
      letters.push(String.fromCharCode(Math.round(Math.random()*25)+65));
  return promo_code_str = letters.join('');
}
