var express = require('express');
var bodyParser = require('body-parser')
var mongo = require('mongodb');

var app = express();
var passwordHash = require('password-hash');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var cart = require('../web-applications-programming-and-support-dev/static/scripts/cart');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('syla'));

var mc = mongo.MongoClient;
var mongourl = "mongodb://localhost:27017/";


app.set('view engine', 'ejs');

app.use(express.static('static'));

app.get('/', function(req, res) {
    res.render("index", {userData : req.signedCookies.userData});
});

app.get('/index', function(req, res) {
    res.render("index", {userData : req.signedCookies.userData});
});

app.get('/error404', function(req, res) {
    res.render("error404", {userData : req.signedCookies.userData});
});

app.get('/login', function(req, res) {
    res.render("login", {userData : req.signedCookies.userData});
});

app.get('/register', function(req, res) {
    res.render("register", {userData : req.signedCookies.userData});
});
app.get('/login-success', function(req, res) {
    res.render("login-success", {userData : req.signedCookies.userData, data: req.body});
});


app.post('/login', function(req, res) {
    mc.connect(mongourl, {useNewUrlParser:true}, function(err, db) {
        if (err) 
        {
            throw err;
        }
        var dbo = db.db("web");
        dbo.collection("User").findOne({username: req.body.username}, function(err, user) {
            if (err)
            {
                throw err;
            }
            if (!user)
            {
                res.redirect("/login");
            } else if (!passwordHash.verify(req.body.password, user.password))
            {
                res.redirect("/login");
            } else
            {
                res.cookie('userData', JSON.stringify({username: user.username, role: user.role}), {signed: true});
                console.log({username: user.username, role: user.role});
                res.redirect('/login-success');
            }
        });
        db.close();
    });
});

app.post('/register', function(req, res) {
    if (req.body.password !== req.body.password2)
    {
        res.render("register", {userData :req.signedCookies.userData});
    } 
    mc.connect(mongourl, {useNewUrlParser:true}, function(err, db) {
        if (err) 
        {
            throw err;
        }
        var dbo = db.db("web");
        dbo.collection("User").findOne({username: req.body.username}, function(err, user) {
            if (err)
            {
                db.close();
                throw err;
            }
            if (!user)
            {
                dbo.collection("User").insertOne({  username : req.body.username, 
                                                    firstname: req.body.firstname, 
                                                    lastname: req.body.lastname,
                                                    role : 'user',
                                                    password : passwordHash.generate(req.body.password)}, function(err, res) {
                                                        if (err) throw err;
                                                        console.log("user registered");
                                                        db.close();
                });
                res.cookie('userData', JSON.stringify({username: req.body.username, role: 'user'}), {signed: true});
                res.redirect('login-success');
            } else {
                res.render("register", {userData :req.signedCookies.userData});
                db.close();
            }
        });
    });
});

app.get('/logout', function(req, res) {
    res.clearCookie('userData');
    res.redirect("/");
});

app.get('/create-tablet', function(req, res){
    var cur = JSON.parse(req.signedCookies.userData);
    if (req.signedCookies.userData === undefined)
    {
        console.log("unloged user");
        res.redirect("/");
    } else if (cur.role !== 'admin')
    {
        console.log("nonadmin");
        res.redirect("/");
    } else
    {
        res.render("create-tablet", {userData :req.signedCookies.userData});
    }
});

app.post('/create-tablet', function(req, res){
    var tablet = {  id: 47,
                    name : req.body.name, 
                    brand : req.body.brand,
                    price : req.body.price, 
                    sale : req.body.sale,
                    screen_size : req.body.screen_size, 
                    RAM : req.body.RAM,
                    storage : req.body.storage };
                    
    mc.connect(mongourl, {useNewUrlParser:true}, function(err, db) {
        if (err) 
        {
            throw err;
        }
        var dbo = db.db("web");
        dbo.collection("products").find().sort({id:-1}).toArray(function(err, maxid) {
            if (err) 
            {
                db.close();
                throw err;
            }
            if (maxid.length === 0)
            {
                tablet.id = 1;
                dbo.collection("products").insertOne(tablet, function(err, tab) {
                    if (err) throw err;
                    console.log("tablet added" + tablet.id);
                    res.render("create-tablet-success", {userData :req.signedCookies.userData});
                    db.close();
                });
            } else{
                tablet.id = maxid[0].id+1;
                dbo.collection("products").insertOne(tablet, function(err, tab) {
                    if (err) throw err;
                    console.log("tablet added" + tablet.id);
                    res.render("create-tablet-success", {userData :req.signedCookies.userData});
                    db.close();
                });
            }
        });
    });
});

app.get('/product/:id', function(req, res) {
    if (req.signedCookies.userData === undefined)
    {
        console.log("unlogged user");
        res.redirect("/");
    } else if (JSON.parse(req.signedCookies.userData).role !== 'admin')
    {
        console.log("nonadmin");
        res.redirect("/");
    } else
    {
        var obj;
        var id = req.params.id;
        var obj = {name: "тестовий продукт", processor: "процесор"};
        res.render('product', {userData : req.signedCookies.userData, productId: id, obj: obj});
    }
});

app.get('/edit/:id', function(req, res)
{
    var cur = JSON.parse(req.signedCookies.userData);
    if (req.signedCookies.userData === undefined)
    {
        console.log("unlogged user");
        res.redirect("/");
    } else if (cur.role !== 'admin')
    {
        console.log("nonadmin");
        res.redirect("/");
    } else
    {
        mc.connect(mongourl, {useNewUrlParser:true}, function(err, db) {
            if (err) throw err;
            var dbo = db.db("web");
            dbo.collection("products").findOne({id: +req.params.id}, function(err, tablet) {
                if (err) 
                {   
                    throw err;
                }
                if (!tablet)
                {
                    res.redirect("/");
                } else
                {
                    res.render('edit-tablet', {id: +req.params.id, userData:req.signedCookies.userData, tablet: tablet});
                }
                db.close();
            });
        });
    }
});

app.post("/edit/:id", function(req, res)
{
    var tablet = {
        name : req.body.name, 
        brand : req.body.brand,
        price : req.body.price, 
        sale : req.body.sale,
        screen_size : req.body.screen_size, 
        RAM : req.body.RAM,
        storage : req.body.storage };
    mc.connect(mongourl, {useNewUrlParser:true}, function(err, db) {
        if (err) 
        {
            throw err;
        }
        var dbo = db.db("web");
        dbo.collection("products").updateOne({id: +req.params.id}, {$set: tablet}, function(err){
            if (err)
            {
                db.close();
                throw err;
            }
            res.render("edit-success", {userData:req.signedCookies.userData});
            db.close();
        });
    });
});

app.get('/tablets/:page', function(req, res) {
    if ((+req.params.page === null) || req.params.page < 1) // todo change redirect
    {
        res.redirect("/tablets/1");
    } else {
        mc.connect(mongourl, {useNewUrlParser:true}, function(err, db) {
            if (err) throw err;
            var dbo = db.db("web");
            dbo.collection("products").find({}).skip((req.params.page-1)*3).limit(3).toArray(function(err, tablet) {
                if (err) throw err;
                //console.log(dbo.collection("products").find({}).count());
                res.render('tablets', {userData :req.signedCookies.userData, tablet : tablet, page : req.params.page, maxPage : Math.ceil(12/3)});
                db.close();
            });
        });
    }
});
app.delete("/delete/:id", function(req, res){
    var cur = JSON.parse(req.signedCookies.userData);
    if (req.signedCookies.userData === undefined)
    {
        console.log("unlogged user");
        res.redirect("/");
    } else if (cur.role !== 'admin')
    {
        console.log("nonadmin");
        res.redirect("/");
    } else
    {
        mc.connect(mongourl, {useNewUrlParser: true}, function(err, db)
        {
            if (err) throw err;
            var dbo = db.db("web");
            dbo.collection("products").deleteOne({id: +req.params.id}, function(err)
            {
                if (err)
                {
                    db.close();
                    throw err;
                }
                db.close();
                res.send('Елемент було видалено!');
            });
        });
    }
});

app.get('/cart', function(req, res) {
    res.render('cart', {userData :req.signedCookies.userData, cartList: req.signedCookies.cartList});    
});

app.put('/cart/:id', function(req, res) {
    mc.connect(mongourl, {useNewUrlParser:true}, function(err, db) {
        if (err) throw err;
        var dbo = db.db("web");
        dbo.collection("products").findOne({id: +req.params.id}, function(err, tablet) {
            if (err) throw err;
            if (tablet)
            {
                if (req.signedCookies.cartList === undefined)
                {
                    var cartList = [];
                    cartList.push({id : tablet.id, name : tablet.name, price : tablet.price - (tablet.sale/100)});
                    res.cookie('cartList', JSON.stringify(cartList), {signed: true});
                } else
                {
                    var cartList = JSON.parse(req.signedCookies.cartList);
                    cartList.push({id : tablet.id, name : tablet.name, price : tablet.price - (tablet.sale/100)});
                    res.cookie('cartList', JSON.stringify(cartList), {signed: true});
                }
                res.send("successfully added to cart");
            } else{
                console.log("failed to add to cart unexisting object");
            }
            db.close();
        });
    });
});

app.delete('/cart/:id', function(req, res)
{
    if (req.signedCookies.cartList === undefined)
    {
        console.log("empty cart list. nothing to remove");
    } else
    {
        console.log(JSON.parse(req.signedCookies.cartList));
        var cartList = JSON.parse(req.signedCookies.cartList);
        cartList.splice(req.params.id, 1);
        res.cookie('cartList', JSON.stringify(cartList), {signed: true});
    }
    res.send("deleted");
});

app.get('/buy', function(req, res){
    var cur = JSON.parse(req.signedCookies.userData);
    if (req.signedCookies.userData === undefined)
    {
        console.log("unlogged user");
        res.redirect('/login');
    } else if (req.signedCookies.cartList === undefined) 
    {
        console.log("nothing to buy");
        req.redirect('/');    
    } else
    {
        mc.connect(mongourl, {useNewUrlParser: true}, function(err, db)
        {
            if (err) throw err;
            var dbo = db.db("web");
            dbo.collection("User").findOne({username: cur.username}, function(err, user) {
                if (err) 
                {   
                    throw err;
                }
                if (!user)
                {
                    console.log("buy problem: user not found");
                    res.redirect("/login");
                } else
                {
                    var cartList = JSON.parse(req.signedCookies.cartList);
                    for (var i = 0; i<cartList.length; ++i)
                    {
                        var dateNow = (new Date());
                        dateNow = dateNow.getDate() + '.' + (1+dateNow.getMonth()) + '.' + dateNow.getFullYear();
                        dbo.collection("purchaces").insertOne({userId:user._id, date:dateNow, price:cartList[i].price, name:cartList[i].name}, function(err)
                        {
                            if (err)
                            {
                                throw err;
                            } 
                            console.log('Елемент було придбано!')
                        });
                    }
                    db.close();
                    res.clearCookie('cartList');
                    res.redirect('/cart');
                }
            });
            
        });
    }
});

app.get('/purchaces', function(req, res)
{
    var cur = JSON.parse(req.signedCookies.userData);
    if (req.signedCookies.userData === undefined)
    {
        console.log("unloged user");
        res.redirect("/");
    } else
    {
        mc.connect(mongourl, {useNewUrlParser:true}, function(err, db) {
            if (err) throw err;
            var dbo = db.db("web");
            dbo.collection("User").findOne({username: cur.username}, function(err, user) {
                if (err) 
                {   
                    throw err;
                }
                if (!user)
                {
                    console.log("purchaces problem: user not found");
                    res.redirect("/login");
                    db.close();
                } else
                {
                    dbo.collection("purchaces").find({userId: user._id}).toArray(function(err, purchaceList) {
                        if (err) throw err;
                        res.render("purchaces", {purchaceList:purchaceList, userData:req.signedCookies.userData});
                        db.close();
                    });
                }
            });
            
        });
    }
});


app.listen(3000);