const functions = require('firebase-functions');

const path = require('path');

const express = require('express');

const bodyParser = require('body-parser');

const engines = require('consolidate');

const firebase = require('firebase-admin');

const firebaseApp = firebase.initializeApp(functions.config().firebase);

const app = express();

// View Engine Setup
app.engine('hbs',engines.handlebars);
app.set('views','./views');
app.set('view engine','hbs');

// Seeting Middle Ware For Body Parser
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// Now The Access Controlling Part
app.use((req,res,next) => {

	res.header("Access-Control-Allow-Origin","*");
	res.header("Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization");

	if(req.method ==='OPTIONS'){
		res.header('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');

		return res.status(200).json({});
	}

	next();

});

app.get('/',(request,response)=>{

    const ref = firebaseApp.database().ref('facts');
    response.render('home');
});

app.post('/api/products', function (req, res) {
    var ref = firebaseApp.database().ref('/products');

    var product = {
        name: req.body.name,
        price:req.body.price
    };
    /* var obj = [{
        id: "123",
        description: "Android Newborn Pacifier"
      },
      {
        id: "345",
        description: "Android Pixel"
      },
      {
        id: "223",
        description: "Chromecast Ultra"
      }
    ]; */
    res.send(ref.push(product)); // Creates a new ref with a new "push key"
    ref.set(obj); // Overwrites the path
    ref.update(obj); // Updates only the specified attributes
  });

  app.get('/api/products', function (req, res) {
      res.set('Cache-Control','public,max-age=300,s-maxage=600');
    
    firebaseApp.database().ref("/products").on('value', function(snapshot){
      res.send(snapshot.val());
    }, function(errorObject) {
      req.send("The read failed: " + errorObject.code);
    });
  });

  app.get('/products',function(req,res){
    firebaseApp.database().ref("/products").on('value', function(snapshot){
        var products = snapshot.val();
        console.log(snapshot.val());
      res.render('products',{products});
    }, function(errorObject) {
      req.send("The read failed: " + errorObject.code);
    });
  });

exports.app = functions.https.onRequest(app);
