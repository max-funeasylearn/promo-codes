//Copyright 2013-2014 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//Licensed under the Apache License, Version 2.0 (the "License").
//You may not use this file except in compliance with the License.
//A copy of the License is located at
//
//    http://aws.amazon.com/apache2.0/
//
//or in the "license" file accompanying this file. This file is distributed
//on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
//either express or implied. See the License for the specific language
//governing permissions and limitations under the License.

//Get modules.
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var fs = require('fs');
var AWS = require('aws-sdk');
var app = express();
var fs = require('fs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var users = require('./modules/users');
var promo_code_types = require('./modules/promo_code_types');
var promo_codes = require('./modules/promo_codes');
var settings = require('./modules/settings');
var projects = require('./modules/projects');
var forceSSL = require('./modules/forcessl.js');

app.use(bodyParser());
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');

app.use(cookieParser());
app.use(session({ secret: 'asv7asvlkj2KJSC234&320L' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '/app')));
app.use(forceSSL());

app.locals.theme = process.env.THEME; //Make the THEME environment variable available to the app.

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log('logging in');
    users.getActiveByUsername(username,'*', function(err, user) {
      if (err) {console.log(err); return done(err); }
      if (!user) {
        console.log('User '+username+' not found!');
        return done(null, false, { message: 'Incorrect username' });
      }
      if (user.password != password) {
        console.log('Password '+password+' is incorrect!');
        return done(null, false, { message: 'Incorrect password' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

//Read config values from a JSON file.
var config = fs.readFileSync('./app_config.json', 'utf8');
config = JSON.parse(config);

//Create DynamoDB client and pass in region.
var db = new AWS.DynamoDB({region: config.AWS_REGION});
//Create SNS client and pass in region.
var sns = new AWS.SNS({ region: config.AWS_REGION});

//GET home page.
app.get('/',  function (req, res) {
  if(typeof req.user == 'undefined')
    {res.redirect('/login');return;}
  var options = {
    root: __dirname + '//app',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  if(req.user.user_type == 'admin')
    var fileName = 'admin.html';
  else
    var fileName = 'moderator.html';
  res.sendFile(fileName, options, function (err) {
    if (err) {
        console.log(err);
    } else {
      console.log('Sent:', fileName);
    }
  });

});

app.get('/login', function(req,res) {
  if(typeof req.user != 'undefined')
    res.redirect('/').end();
  var options = {
    root: __dirname + '//app',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  res.sendFile('login.html', options, function (err) {
    if (err) {
        console.log(err);
    } else {
      console.log('Sent:', 'login.html  ');
    }
  });
});

app.post('/login',function(req, res, next) {
  if(typeof req.user != 'undefined'){
    res.json({'error':'error'});return;
  }
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { res.json({'error':'Wrong username or password'});return; }
    req.logIn(user, function(err) {
      console.log(err);
      if (err) { return next(err); }
      return res.json({'success':'1'});
    });
  })(req, res, next);
});



/*
 *
 *  USER ACTIONS
 *
*/

//GET all users
app.get('/users', function(req,res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }
  res.setHeader('Content-Type', 'application/json');
  users.get(function(error,results){
    if(error !== null){
      res.json({"error":"Error getting users"})
    }else {
      res.json(results);
    }
  });
});

//GET user
app.get('/users/user_info', function(req,res) {
  if(typeof req.user == 'undefined'){
    res.json({"error":"user not found"});;return;
  }

  users.getActiveByUsername(req.user.username,'user_type', function(error, user) {
      if(error !== null){
        res.json({"error":"Error getting user"})
      }else {
        res.json(user);
      }
  });
});

//POST signup form.
app.post('/users/register', function(req, res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  users.create(req.body,function(error,response){
    if(error !== null){
      res.json({"error":"error"});
      console.log(error);
    }
    if(response !== null) {
      res.json(response);
    }
  });
});

//POST signup form.
app.post('/users/edit', function(req, res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  users.update(req.body,function(error,response){
    if(error !== null){
      res.json({"error":"error"});
      console.log(error);
    }
    if(response !== null) {
      res.json(response);
    }
  });
});

// DELETE users
app.post('/users/delete', function(req,res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  users.delete(req.body.user_ids, function(error,results){
    if(error !== null){
      res.json({"error":"Error deleting users"})
    }else {
      res.json(results);
    }
  });
});


/*
 *
 *  PROMO CODE TYPES ACTIONS
 *
*/

//GET all promo code types
app.get('/promo_code_types', function(req,res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  res.setHeader('Content-Type', 'application/json');
  promo_code_types.get(function(error,results){
    if(error !== null){
      res.json({"error":"Error getting promo code types"})
    }else {
      res.json(results);
    }
  });
});

//POST promo code type form.
app.post('/promo_code_types/create', function(req, res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  promo_code_types.create(req.body,function(error,response){
    if(error !== null){
      res.json({"error":"error"});
      console.log(error);
    }
    if(response !== null) {
      res.json(response);
    }
  });
});

//POST promo code type form.
app.post('/promo_code_types/edit', function(req, res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  promo_code_types.update(req.body,function(error,response){
    if(error !== null){
      res.json({"error":"error"});
      console.log(error);
    }
    if(response !== null) {
      res.json(response);
    }
  });
});

// DELETE promo code types
app.post('/promo_code_types/delete', function(req,res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  promo_code_types.delete(req.body.promo_code_type_ids, function(error,results){
    if(error !== null){
      res.json({"error":"Error deleting promo code types"})
    }else {
      res.json(results);
    }
  });
});

/*
 *
 *  PROMO CODES ACTIONS
 *
*/

//POST promo code form.
app.post('/promo_codes/create', function(req, res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  console.log('user is '+req.user.user_type);
  if(req.user.user_type == 'admin' || parseInt(req.user.promocodes_limit) == 0 ){
    promo_codes.create(req.body,req.user.user_id,function(error,results){
      if(error !== null){
        res.json({"error":error});return;
      }
      if(results !== null) {
        res.json(results);return;
      }
    });
  }else{
    var args = {};
    args.user_id = req.user.user_id;
    args.today = true;
    args.items_per_page = 0;

    console.log('checking if promo codes per day limit is reached');
    promo_codes.get(args, function(error,results){
      if(error !== null){
        res.json({"error":"Could not get promo codes"}); return;
      }else {
        if(req.user.promocodes_limit > results.length){
          console.log('Promo codes per day limit not reached! user limit is:'+req.user.promocodes_limit+', today created: '+results.length);
          promo_codes.create(req.body,req.user.user_id,function(error,results){
            if(error !== null){
              res.json({"error":error});
              console.log(error);
            }
            if(results !== null) {
              res.json(results);
            }
          });
        }else {
          console.log('Promo codes per day limit reached! user limit is:'+req.user.promocodes_limit+', today created: '+results.length);
          console.log('Not creating promo code!');
          res.json({"error":'Promo codes per day limit reached.  Your daily limit is: '+req.user.promocodes_limit+', today created: '+results.length}); return;
        }
      }
    });
  }
});

//POST promo code form.
app.post('/promo_codes/edit', function(req, res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  promo_codes.update(req.body,function(error,response){
    if(error !== null){
      res.json({"error":"error"});
      console.log(error);
    }
    if(response !== null) {
      res.json(response);
    }
  });
});

//GET all promo codes
app.get('/promo_codes', function(req,res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  var args = req.query;

  if(req.user.user_type != 'admin')
    args.user_id = req.user.user_id;

  res.setHeader('Content-Type', 'application/json');
  promo_codes.get(args, function(error,results){
    if(error !== null){
      res.json({"error":"Error getting promo codes"})
    }else {
      res.json(results);
    }
  });
});

// DELETE promo codes
app.post('/promo_codes/delete', function(req,res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  promo_codes.delete(req.body.promo_code_ids, function(error,results){
    if(error !== null){
      res.json({"error":"Error deleting promo codes"})
    }else {
      res.json(results);
    }
  });
});

// MARK AS NOT VALID promo codes
app.post('/promo_codes/mark_as_not_valid', function(req,res) {
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  promo_codes.mark_as_not_valid(req.body.promo_code_ids, function(error,results){
    if(error !== null){
      res.json({"error":"Error marking promo code as not valid"})
    }else {
      res.json(results);
    }
  });
});

// GENERATE promo codes
app.post('/promo_codes/generate', function(req,res) {

  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  if(!isNaN(req.body.number_of_codes) && parseInt(req.body.number_of_codes) < 1000 && parseInt(req.body.number_of_codes) > 0){

    var promo_codes_created = 0;

    console.log('user is '+req.user.user_type);
    if(req.user.user_type == 'admin' || parseInt(req.user.promocodes_limit) == 0 ){
      promo_codes.createBulk(req.body,req.user.user_id,function(error,results){
        if(error !== null){
          res.json({"error":error});return;
        }
        if(results !== null) {
          res.json(results);return;
        }
      });
    }else{
      var args = {};
      args.user_id = req.user.user_id;
      args.today = true;
      args.items_per_page = 0;

      console.log('checking if promo codes per day limit is reached');
      promo_codes.get(args, function(error,results){
        if(error !== null){
          res.json({"error":"Could not get promo codes"}); return;
        }else {
          if(req.user.promocodes_limit > results.length){
            console.log('Promo codes per day limit not reached! user limit is:'+req.user.promocodes_limit+', today created: '+results.length);
            if(req.body.number_of_codes > req.user.promocodes_limit - results.length)
              req.body.number_of_codes = req.user.promocodes_limit - results.length;
            promo_codes.createBulk(req.body,req.user.user_id,function(error,results){
              if(error !== null){
                res.json({"error":error});
                console.log(error);
              }
              if(results !== null) {
                res.json(results);
              }
            });
          }else {
            console.log('Promo codes per day limit reached! user limit is:'+req.user.promocodes_limit+', today created: '+results.length);
            console.log('Not creating promo code!');
            res.json({"error":'Promo codes per day limit reached.  Your daily limit is: '+req.user.promocodes_limit+', today created: '+results.length}); return;
          }
        }
      });
    }
  }else{
    res.json({"error":"Wrong number of codes given"}).end();return;
  }
});


// Check if export file exists
app.get('/check_export_file',function(req,res){

  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  fs.stat('shared/export.txt',function(err,stats){
    if(err !== null){
      res.json({"file_exists":"0"}).end();
      return;
    }

    res.json({"file_exists":"1","export_link":"export.txt"}).end();
  });
});

// Remove export file
app.get('/remove_export_file',function(req,res){

  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  try{
    fs.unlink('shared/export.txt',function(){
      res.json({"success":"1"}).end();
    })
  }catch(e){
    res.json({"success":"0"}).end();
  }
});


/*
 *
 *  SETTINGS ACTIONS
 *
*/

//GET all settigns

app.get('/settings',function(req,res){
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  settings.get(function(error,results){
    if(error !== null){
      console.log(error);
      res.json({"error":"Failed to get settings"})
    }else {
      res.json(results);
    }
  });
});

//POST settings

app.post('/settings/save',function(req,res){
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  settings.save(req.body,function(error,results){
    if(error !== null){
      console.log(error);
      res.json({"error":error})
    }else {
      res.json('{success:1}');
    }
  });
})

/*
 *
 *  PROJECT NAMES ACTIONS
 *
*/

app.get('/projects/project_names',function(req,res){
  if(typeof req.user == 'undefined'){
    res.status(403).end();return;
  }

  projects.getProjectNames(function(error,results){
    if(error !== null){
      console.log(error);
      res.json({"error":error})
    }else {
      res.json(results);
    }
  });
});

/*
 *  LOGOUT
 */

app.get('/logout', function(req, res){
  if(typeof req.user == 'undefined'){
    res.redirect('/login');return;
  }

  req.logOut();
  res.clearCookie('connect.sid');
  req.session.destroy(function (err) {
    res.redirect('/login');
  });
});


app.get('/export.txt',function(req,res){
  if(typeof req.user == 'undefined'){
    res.redirect('/login');return;
  }

  if(req.user.user_type != 'admin'){
    res.status(403).end();return;
  }

  var options = {
    root: __dirname + '/shared/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };
 res.setHeader('Content-disposition', 'attachment; filename=' + 'export.txt');
  res.sendFile("export.txt", options, function (err) {
    if (err) {
      next(err);
    } else {
      console.log('Sent:');
    }
  });
});

/*
 *  API
 */

app.get('/isvalid', function(req,res){
  var response = {
    error: null,
    commands: {
      name: null,
      something: null
    }
  }

  if(typeof req.query.promocode == 'undefined'){
    response.error = {code: 1, message: "Promo code not given"};
    response.commands = null;
    res.status(400).json(response);
  }

  promo_codes.getByPromoCode(req.query.promocode,function(error,promocode){
    if(error !== null){
      response.error = {code: 2, message: 'Promo code not found'}
    }else if(parseInt(promocode.valid) != 1)
      response.error = {code: 3, message: 'Promo code not valid'}
    else if(parseInt(promocode.used) == 1)
      response.error = {code: 4, message: 'Promo code already used'}

    promo_codes.setUsed(req.query.promocode,function(error,results){
      if(error !== null)
        response.error = {code: 5, message: 'Promo code unable to be set as "used"'}


      if(response.error !== null){
        response.commands = null;
        res.status(400).json(response).end();
        return;
      }

      response.commands = {
        name: promocode.promo_code_api_title,
        value: promocode.value
      }
      res.json(response);
    });

  });
});

/*
 *
 *  CRON JOBS
 *
 */

app.get('/backup',function(req,res){
  fs.appendFile('cron.txt', new Date()+'\n', (err) => {
    if (err) throw err;
    console.log('Cron job!'+(new Date()));
    res.send('Cron job!'+(new Date())).end();
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
