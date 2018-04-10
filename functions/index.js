
const functions = require('firebase-functions');

const path = require('path');
const os = require('os');
const fs = require('fs');


const cors = require('cors')({origin:true});
const Busboy = require('busboy');

const express = require('express');
const bodyParser = require('body-parser');
const engines = require('consolidate');
const firebase = require('firebase-admin');

const firebaseApp = firebase.initializeApp(functions.config().firebase);

//firebaseApp.storage().bucket('Products').upload()

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

    console.log(firebaseApp.storage().bucket().name);

    //const ref = firebaseApp.database().ref('facts');
    response.render('home',{partials:{navbar:'./partials/navbar',head:'./partials/head'}});
});


app.post('/uploads',(req,res)=>{

  uploadFile(req,res);

})

app.post('/api/products', function (req, res) {
    var ref = firebaseApp.database().ref('/products');

    var product = {
        name: req.body.name,
        price:req.body.price
    };



    //const key = ref.push().key;

    var key = ref.push().key;

    console.log(key);

    ref.child(key).set(product).then(()=>{
      return res.send(key);
    }).catch(err=>{
      console.log(err);
      res.send(err);
    })
    
    


    /* res.send(ref.push(product)); // Creates a new ref with a new "push key"
    ref.set(obj); // Overwrites the path
    ref.update(obj); // Updates only the specified attributes */

    
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


  function uploadFile(req,res){
    cors(req,res,()=>{

      if(req.method !=='POST'){
        return res.status(500).json({
            message: "Not Allowed"
        })
      }
  
      const busboy = new Busboy({headers:req.headers});
  
      let uploadData = null;
  
      let myFileName = null;
  
      busboy.on('file',(fieldname,fileStream,filename,encoding,mimetype)=>{
          const filePath = path.join(os.tmpdir(),filename);
  
          //console.log(fieldname);
          //console.log(fileStream);
          console.log(filename);
          //console.log(encoding);
          //console.log(mimetype);
  
          myFileName = filename;
  
          uploadData = {file:filePath,mimetype:mimetype};
  
          fileStream.pipe(fs.createWriteStream(filePath));
      });
  
      busboy.on('finish',()=>{
  
          //const bucket = gcs.bucket('firenode-5276f.appspot.com');
          const bucket = firebaseApp.storage().bucket();

        



          //const imageRef = bucket.child('Images');
  
          bucket.upload(uploadData.file,{
              uploadType:'media',
              destination:'Images/'+myFileName,
              metadata:{
                  metadata:{
                      contentType:uploadData.mimetype
                  }
              }
          }).then(storageFile=>{
              console.log(storageFile);
              console.log(myFileName);
  
              return res.status(200).json({
                message:"Image Uploaded Successfully",
                url:myFileName
  
              })
  
              /* bucket.file(myFileName).getSignedUrl({
                action:'read',
                expires:'03-09-2491'
              }).then(signedurl=>{
                
              }).catch(err=>{
                console.log(err);
                res.status(500).json({
                  message:"Error Occur",
                  error:err.message
                  
                });
              }) */
  
          
  
              
  
              
  
          }).catch((err)=>{
              res.status(500).json({
                  message:"Error Occur",
                  error:err.message
                  
              });
          });
  
      });
  
      busboy.end(req.rawBody);
  
    });
  }

exports.app = functions.https.onRequest(app);
