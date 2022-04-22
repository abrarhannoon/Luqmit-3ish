const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")  
const db = require("../config/db") 

router.get("/user/verify/:email/:emailUUID", (req ,res)=>{
    let {email, emailUUID} = req.params;
    db.query("SELECT emailUUID FROM account WHERE email= ?", [email], async (err, result)=>{
        if(err){
            console.log(err +"error while verefication")
        }else{    
            if(result.length > 0){
                let compResult   
                compResult = await bcrypt.compare(emailUUID, result[0].emailUUID)
                .then((compResult)=>{
                    if(compResult){    
                        db.query("UPDATE account SET verified = 1, emailUUID = NULL WHERE email = ?", [email], (error)=>{
                            if(error){
                                console.log(error + "Error while verifying the user")
                            }else{  
                         
                                res.render('logIn',{
                                    message:'Email veriefied Succesfully'
                                })   
                            }
                        })  
                    }else{    
                        res.render("signUp", {message: "Please request another verification link by contacting us"})  
                    }
                })
                .catch((e)=>{
                    console.log("Error while comparing the unique string with the hashed one") 
                    res.render("signUp", {message: "Please try to verify your account later"})  
                })
            }else{ 
                res.send("This link is not valid anymore!")
            }
        }
    })
})

//Reset Password 
passEmail = require('../config/passwordRequest')  
    
router.post("/newPasswordReq", (req, res)=>{
    let {email} = req.body  
    //UPDATE account SET passwordUUID = NULL WHERE email = ?
    db.query("SELECT EMAIL FROM account WHERE EMAIL = ?", [email], async(error, result)=>{
        if(error){
            console.log("Error while chicking if the user exists in the DB")  
            res.render("newPassword", {message: "Something went wrong please try again"})
        }else{
            if(result.length > 0){      
                passEmail.sendVerEmail(email)
                res.render("newPassword", {message: "Please check your email to be able to reset your password"})
            }else{
                res.render("newPassword", {message: "Please enter a valid email"})   
                console.log(result)         
            }
        }
    }) 
})


router.get("/resetRequest/:email/:passwordUUID", (req, res)=>{
    let {email, passwordUUID} = req.params 
    db.query("SELECT passwordUUID FROM account WHERE email= ?", [email], async (error, result)=>{
        if(result.length > 0){
            let compResult   
            console.log(passwordUUID)
            console.log(result[0].passwordUUID)
            compResult = await bcrypt.compare(passwordUUID, result[0].passwordUUID)
            .then((compResult)=>{
                if(compResult){  
                    console.log(compResult)
                    req.session.autherized = true        
                    req.session.email = email           
                    res.redirect(`/setNewPass/${email}`)       
                    db.query("UPDATE account SET passwordUUID = NULL WHERE email = ?",[email], (error)=>{      
                        if(error){       
                            console.log("Error occured while deleting the reset password string ", error);    
                        }else{
                            console.log("passwordUUID Deleted successfully!")
                        }  
                    }) 
                }else{ 
                    res.render("newPassword", {message: "This link is invalid, please request another link"})     
                }
            })
            .catch((e)=>{    
                console.log("Error while comparing the unique strings  " + e)
                res.render("newPassword", {message: "This link is invalid, please request another link"})     
            })
            
        }else{
            res.render("newPassword", {message: "This link is invalid, please request another link"})
        }
        if(error){
            console.log("Error while searching for the unique string")
            res.render("newPassword", {message: "This link is invalid, please request another link"})
        }
    })

}) 
//const regePassword = /^(?=(.*[a-zA-Z]){1,})(?=(.*[0-9]){2,}).{8,}$/;

router.post("/newPassword", (req, res)=>{
    let email = req.session.email
    let {password, conPassword} = req.body  
    console.log(req.body)
    if(password !== conPassword){
        res.render('setNewPass',{         
        failMessage:"Password and confirm password must be the same, please try again"
        });   
    }else{
            console.log("aces")
            let hashedPass = bcrypt.hash(password, 8)
            .then((hashedPass)=>{
                //UPDATE account SET passwordUUID = NULL WHERE email = ?          
                db.query("UPDATE account SET password = ? WHERE email = ?", [hashedPass,email],(error)=>{
                    if(error){     
                        console.log("Error while setting the new password ", e)     
                    }else{
                        res.render("login", {message: "Password changed successfully"})
                    }
                })
            })
            .catch((e)=>{console.log("Error while hashing the password")})
       /*}else{
            res.render('setNewPass',{
                failMessage:"Your password must include both lower and upper case charachter, at least one number or symbol,and at least 8 characters"
            });
        }  
        */   
    }
})          


module.exports = router