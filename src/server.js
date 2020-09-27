const express = require("express")
const bodyParser = require("body-parser")
const MongoClient = require("mongodb")
const path = require('path')
require('dotenv').config()

const app = express();

app.use(express.static(path.join(__dirname, '/build')))
app.use(bodyParser.json())
const withDB = async (operations, res) => {
    try{
        const client = await MongoClient.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@blog-cluster.xbtc7.gcp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,{useNewUrlParser: true, useUnifiedTopology:true})
        const db = client.db("blogDB")
        
        operations(db)

        client.close
        } 
    catch(error){
        res.status(500).status.json({message:"Error connecting to db", error})
    }
}
app.get("/api/articles/:name", async (req, res) => {
    withDB(async (db) => {
    const articleName=req.params.name
    const articleInfo = await db.collection("articles").findOne({name:articleName})
    res.status(200).json(articleInfo)
    }, res)
} )

app.post("/api/articles/:name/upvote", async (req, res) => {
    withDB(async (db)=>{
        const articleName=req.params.name
        
        const articleInfo = await db.collection("articles").findOne({name:articleName})
        
        await db.collection("articles").updateOne({name:articleName},
        {'$set':{
            upvotes:articleInfo.upvotes +1
        }}    )
        const updatedArticleInfo = await db.collection("articles").findOne({name:articleName})
        res.status(200).json(updatedArticleInfo)
    }, res)
})

app.post("/api/articles/:name/add-comment", async (req, res) => {
    const { username, text} = req.body
    const articleName=req.params.name

    withDB(async (db) =>{
        const articleInfo = await db.collection("articles").findOne({name:articleName})
        await db.collection("articles").updateOne({name:articleName},{
            '$set':{
                comments: articleInfo.comments.concat({username, text})
            }
        })
        const updatedArticleInfo = await db.collection("articles").findOne({name:articleName})
        res.status(200).json(updatedArticleInfo)
    }, res)
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/build/index.html'))
})
app.listen(8000, ()=>console.log(`Listening on port 8000`))