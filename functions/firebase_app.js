const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const firebaseApp = firebase.initializeApp(functions.config().firebase);
exports.firebaseApp = firebaseApp;

exports.getAllProduct=(req,res)=>{
    firebaseApp.database().ref("/products").on('value', function(snapshot){
        res.send(snapshot.val());
      }, function(errorObject) {
        req.send("The read failed: " + errorObject.code);
      });
}


