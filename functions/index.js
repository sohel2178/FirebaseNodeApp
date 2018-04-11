
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
// Test Package
const Multer = require('multer');

const firebaseApp = firebase.initializeApp(functions.config().firebase);

//firebaseApp.storage().bucket('Products').upload()

const app = express();


//app.use(cors());


const multer = Multer();


const handleFieldsWithMulter = multer.fields([
  { name: 'name' },
  { name: 'price' },
  { name: 'image' }
]);

const handlePostWithMulter = (req, res) => {
  const formData = req.body;
  res.status(200).send(formData);
}

const loggingMiddleware = (req, res, next) => {
  console.log(`request body: ${req.body}`);
  next();
}

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

//app.post('/mmmm',loggingMiddleware, handleFieldsWithMulter, handlePostWithMulter);
app.post('/mmmm',multer.any(),(req,res)=>{

    console.log(req.files);
    console.log(req.body.name);
    console.log(req.body.price);
    console.log(req.body);
  
  
});


app.post('/uploads',(req,res)=>{
  uploadFile(req,res);
})

app.post('/api/products', function (req, res) {
    console.log(req.body);
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
      //return uploadFile(req,res,key);
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

      let formData = new Map();

      let counter = 0;
      let myfileKey = "";
  
      //let myFileName = null;

      busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        
        //req.pause();
        //console.log('Field [' + fieldname + ']: value: ' + val);
        formData.set(fieldname,val);
        counter++;

        if(counter===2){
          req.pause();

        

          // Update Database and Get Key

          var ref = firebaseApp.database().ref('/products');

          var product = {
              name: formData.get('name'),
              price:formData.get('price')
          };
          //const key = ref.push().key;

          var key = ref.push().key;

          

          ref.child(key).set(product).then(()=>{
            myfileKey = key;

            console.log("Key Name Set as : "+myfileKey);
            //return res.send(key);
            //return uploadFile(req,res,key);
            req.resume(); // REsume The Request
            return;
          }).catch(err=>{
            console.log(err);
            res.send(err);
          })

          console.log("Name: ",formData.get('name'));
          console.log("Price: ",formData.get('price'));
          console.log("Counter: ",counter);

          

        }

        
      });
  
      busboy.on('file',(fieldname,fileStream,filename,encoding,mimetype)=>{
        //myFileName = fileName;
        console.log("Key Name ",myfileKey);
        const filePath = path.join(os.tmpdir(),filename);

        uploadData = {file:filePath,mimetype:mimetype};

        fileStream.pipe(fs.createWriteStream(filePath));
      });

      
  
      busboy.on('finish',()=>{

          const bucket = firebaseApp.storage().bucket();
          //const imageRef = bucket.child('Images');
  
          bucket.upload(uploadData.file,{
              uploadType:'media',
              destination:'Images/'+myfileKey,
              metadata:{
                  metadata:{
                      contentType:uploadData.mimetype
                  }
              }
          }).then(storageFile=>{
              //console.log(storageFile);

              return res.status(200).json({
                message:"Image Uploaded Successfully",
                url:myfileKey
  
              })
              
  
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
