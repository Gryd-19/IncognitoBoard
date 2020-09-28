/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
const CONNECTION_STRING = process.env.DB; 
//MongoClient.connect(CONNECTION_STRING, function(err, db) {}); 
module.exports = function (app) {
  //board
  app.route('/api/threads/:board')
  .get((req,res)=>{
    let board=req.params.board;
     MongoClient.connect(CONNECTION_STRING, function(err, client) {
      const db=client.db('anon-message-board');
      db.collection(board).find({},{reported:0,delete_password:0,'replies.delete_password':0,'replies.reported':0}).sort({bumped_on:-1}).limit(10).toArray((err,data)=>{
        if(err)console.error(err);
        data.forEach((dat)=>{
          let x=dat.replies.length;
          if(x>3)dat.replies=dat.replies.slice(-3);
        });
        res.json(data);
      });
     });
  })
  .post((req,res)=>{
    let board=req.params.board;
    let text=req.body.text;
    let del=req.body.delete_password;
    //res.json({board:board,text:text,del:del});
    MongoClient.connect(CONNECTION_STRING, function(err, client) {
      const db=client.db('anon-message-board');
      let thread={
        text:text,
        created_on:new Date(),
        bumped_on:new Date(),
        reported:false,
        delete_password:del,
        replies:[],
        replycount:0
      };
      db.collection(board).insertOne(thread,(err,data)=>{
        if(err)console.error(err);
        if(data)res.redirect('/b/'+board);
      });
    });
  })
  .put((req,res)=>{
    let board=req.params.board;
    let id=ObjectId(req.body.report_id);
     MongoClient.connect(CONNECTION_STRING, function(err, client) {
       const db=client.db('anon-message-board');
       db.collection(board).findOneAndUpdate({'_id':id},{$set:{reported:true}},(err,data)=>{
         if(err)console.error(err);
         console.log(id);
         if(data.value)return res.send('success');
         
         res.send('not found');
       });
     });
  })
  .delete((req,res)=>{
    let board=req.params.board;
    let id=ObjectId(req.body.thread_id);
    let pass=req.body.delete_password;
    MongoClient.connect(CONNECTION_STRING,(err,client)=>{
      const db=client.db('anon-message-board');
      db.collection(board).findOne({'_id':id},(err,data)=>{
        if(err)console.error(err);
        if(!data)res.send('id not found');
        else {
          if(data.delete_password!=pass)res.send('incorrect password');
          else {db.collection(board).remove({'_id':id});res.send('success');}
        }
      });
    });
  });
  //thread
  app.route('/api/replies/:board')
  .get((req,res)=>{
    let board=req.params.board;
    let id=ObjectId(req.query.thread_id);
    
    MongoClient.connect(CONNECTION_STRING,(err,client)=>{
      const db=client.db('anon-message-board');
      db.collection(board).findOne({'_id':id},{'reported':0,'delete_password':0,'replies.reported':0,'replies.delete_password':0},(err,data)=>{
        if(err)console.error(err);
        return res.json(data);
      });
    });
  })
  .post((req,res)=>{
    let board=req.params.board;
    let thread=ObjectId(req.body.thread_id);
    let text=req.body.text;
    let del=req.body.delete_password;
    let reply={
      _id:new ObjectId(),
      text:text,
      created_on:new Date(),
      delete_password:del,
      reported:false
    };
    MongoClient.connect(CONNECTION_STRING,(err,client)=>{
      const db=client.db('anon-message-board');
      db.collection(board).findOneAndUpdate({'_id':thread},{$set:{bumped_on:new Date()},$push:{replies:reply},$inc:{replycount:1}},(err,data)=>{
        if(err)console.error(err);
        if(!data)return res.send('not found');
        
      });
      res.redirect('/b/'+board+'/'+thread);
    });
  })
  .put((req,res)=>{
    let board=req.params.board;
    let thread=ObjectId(req.body.thread_id);
    let reply=ObjectId(req.body.reply_id);
     MongoClient.connect(CONNECTION_STRING,(err,client)=>{
      const db=client.db('anon-message-board');
      db.collection(board).findOneAndUpdate({'_id':thread,'replies._id':reply},{$set:{'replies.$.reported':true}},(err,data)=>{
        if(err)console.error(err);
        return res.send('success');
      });
     });
  })
  .delete((req,res)=>{
    let board=req.params.board;
    let thread=ObjectId(req.body.thread_id);
    let reply=ObjectId(req.body.reply_id);
    let del=req.body.delete_password;
     MongoClient.connect(CONNECTION_STRING,(err,client)=>{
      const db=client.db('anon-message-board');
      db.collection(board).findOneAndUpdate({'_id':thread,'replies':{$elemMatch:{'_id':reply,'delete_password':del}}},{$set:{'replies.$.text':'[deleted]'}},(err,data)=>{
        if(err)console.error(err);
        if(!data.value)res.send('incorrect password');
        else res.send('success');
      });
     });
  });

};
