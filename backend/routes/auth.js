const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = "Shravni";

// Route 1 : Creating user using credentials :POST"/api/auth/createuser"
router.post('/createuser', [
    //Adding express validator to check validation of email password and name
    body('name').isLength({ min: 5 }),
    body('email').isEmail(),
    body('password').isLength({ min: 5 }),
], async (req, res) => {
    let success=false;
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ success, errors: errors.array() });

    try{
    //check whether user already exists
    let user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.status(400).json({ success, error: "Sorry a user with this email already exists" })
    }

    //Creating password using bcrypt
    const salt = await bcrypt.genSalt(5);
    const secPass = await bcrypt.hash(req.body.password, salt);
    //create a new user  
    user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
    })


    // .then(user =>res.json(user)).catch(error => {console.log(error)
    //     res.json({error:"Please enter a unique value for email"})});
    const data = {
        user: {
            id: user.id
        }
    }
    const authToken = jwt.sign(data, JWT_SECRET);
    success=true;
    res.json({success,authToken})
    }
    catch(error){
    // console.log(authToken);
    console.error(error.message);
    res.json(500).send("internal server error");
    }
})


// Route 2 : Login user using credentials :POST"/api/auth/login"


router.post('/login', [
    //Adding express validator to check validation of email password and name
    body('email').isEmail(),
    body('password').exists(),
], async (req, res) => {
    //check if there are errors then return bad request and errors.
    let success=false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        console.log(user);
        if (!user) {
            success=false
            return res.status(400).json({ error: "Please login with correct credentials" });
        }

        const passCompare = await bcrypt.compare(password, user.password);
        if (!passCompare) {
            success=false
            return res.status(400).json({ success, error: "Please login with correct credentials" });
        }
        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        // res.json({ authToken: authToken });
        success=true;
        res.json({success,authToken})
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Some error occured");
    }
})

// Route 3 : Get loggedIn user details using :POST"/api/auth/getuser"
router.post('/getuser',fetchuser, async(req,res)=>{
    try{
        userId=req.user.id;
        let user=await User.findById(userId).select("-password")
        res.send(user);
        
    } catch(error){
        console.log(error.message);
        res.status(500).send("Some error occured");
    }
    })

module.exports = router;
