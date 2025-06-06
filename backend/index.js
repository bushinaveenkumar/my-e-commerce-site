const express=require("express");
const app=express();
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const multer =require("multer");
const cors=require("cors");
const path=require('path');
const { type } = require("os");
require('dotenv').config();
const port=process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

//Database connection with MongoDB
mongoose.connect("mongodb+srv://bushinaveenkumar2:0bbh51uRS70T3u3h@cluster0.oqndt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")


app.get("/", (req,res)=>{
    res.send("Express app is running")
})


app.listen(port, (error)=>{
    if (!error){
        console.log("server running on Port " + port)
    } 
    else{
        console.log("Error : "+error)
    }
})

// Image storage Engine
const storage=multer.diskStorage(
    {
        destination:'./upload/images',
        filename:(req, file, cb)=>{
            return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
        }
    }
)

const upload=multer({storage:storage})

//Creating Upload end POint for images
app.use('/images', express.static('upload/images'))

app.post('/upload', upload.single('product'), (req,res)=>{    
    res.json({
        success:true,
        image_url:`http://localhost:4000/images/${req.file.filename}`,
        console:req.file.filename
    })
})

// Schema for creating the Products

const Product=mongoose.model("Product", {
    id:{
        type:Number,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    new_price:{
        type:Number,
        required:true
    },
    old_price:{
        type:Number,
        required:true
    },
    discriminatorate:{
        type:Date,
        default:Date.now
    },
    available:{
        type:Boolean,
        default:true
    }
})

app.post('/addproduct', async (req, res)=>{
    console.log("addproduct api hitted");
    let products= await Product.find({});
    let id;
    if (products.length > 0)
        {
            let lastProductArray=products.slice(-1);
            let lastProduct=lastProductArray[0];
            id= lastProduct.id+1;
        }
    else{
        id=1
    }    

    const product =new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price
    })
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name
    })
})

//Creating API for removing the product

app.post('/removeproduct', async (req, res)=>{
    await Product.findOneAndDelete({id:req.body.id})
    console.log("product removed");
    res.json(
        {
            success:true,
            name:req.body.name
        }   
    )
})

// Creating API for getting all products


app.get('/allproducts', async(req,res)=>{
    let products= await Product.find({})
    console.log("All products fetched");
    res.send(products);
 })

 // Creating API for getting New collections
 app.get("/newcollections", async (req,res)=>{
    const products=await Product.find({});
    const newcollections=products.slice(1).slice(-8)
    res.send(newcollections)
 })

 // Creating API for getting Popular in women
 app.get("/popularinwomen", async (req,res)=>{
    const products=await Product.find({category:"women"});    
    const popularinwomen=products.slice(0,4)
    res.send(popularinwomen)
 })

 // Creating middleware for getting user data 
 const fetchUser = async (req, res, next) => {
    let token = req.header('auth-token'); // Read from Authorization header

    if (!token) {
        return res.status(401).json({ error: "Please authenticate using a valid token" });
    }
    console.log(token)
    try {
        console.log(token)
        console.log(jwt.decode(token)); // Decodes without verifying
        const data = jwt.verify(token, 'secret_ecom'); // Verify token
        console.log(data)
        req.user = data.user;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

   
// Creating API for adding products to cart
    app.post("/addtocart", fetchUser, async(req, res)=>{
        console.log(req.body, req.user)
    })


 // creating user model

 const Users=mongoose.model('user',{
    name:{
        type:String,        
    },
    email:{
        type:String,
        unique:true
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object
    },
    date:{
        type:Date,
        default:Date.now()
    }
 })
 
 //end point for registering the user
app.post("/signup", async (req, res)=>{
    let check= await Users.findOne({email:req.body.email})
    if (check){
        return res.status(400).json({success:false, error:"User already exists with same email"})
    }

    let cart={}; 
    for (let i=0 ; i<300; i++){
        cart[i]=0;
    };

    const user= new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart
    })

    await user.save();

    const data={
        user:{id:user.id}
    }

    const token=jwt.sign(data, 'secret_ecom');
    res.json({success:true, token})
})
    
//end point for logging the user

app.post("/login", async (req, res)=>{
    let user=await Users.findOne({email:req.body.email});
    console.log(user)
    if (user){
        const passcompare= req.body.password===user.password;

        if (passcompare){
            let data={
                user:{id:user.id}
            }
            const token=jwt.sign(data, 'secret_ecom');
            res.json({success:true, token} )
        }
        else{
            res.json({success:false, error:"Wrong Password"} )
        }
    }
    else{
        res.json({success:false, error:"Wrong email_id"} )
    }
})