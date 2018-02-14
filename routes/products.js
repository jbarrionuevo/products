var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}))
//build the REST operations at the base for blobs
//this will be accessible from http://127.0.0.1:3000/blobs if the default route for / is left unchanged
router.route('/')
    //GET all blobs
    .get(function(req, res, next) {
        //retrieve all blobs from Monogo
        mongoose.model('Product').find({}, function (err, products) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
                    html: function(){
                        res.render('products/index', {
                              title: 'All my Products',
                              "products" : products
                          });
                    },
                    //JSON response will show all blobs in JSON format
                    json: function(){
                        res.json(infophotos);
                    }
                });
              }
        });
    })
    //POST a new blob
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var name = req.body.name;
        var type = req.body.type;
        var  created = req.body.created;
        //var company = req.body.company;

        var available = req.body.available;
        //call the create function for our database
        mongoose.model('Product').create({
            name : name,
            type : type,
            created : created,
            available : available
        }, function (err, product) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  //Blob has been created
                  console.log('POST creating new product: ' + product);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("products");
                        // And forward to success page
                        res.redirect("/products");
                    },
                    //JSON response will show the newly created blob
                    json: function(){
                        res.json(product);
                    }
                });
              }
        })
    });

    /* GET New Product page. */
    router.get('/new', function(req, res) {
        res.render('products/new', { title: 'Add New Product' });
    });

    // route middleware to validate :id
    router.param('id', function(req, res, next, id) {
        //console.log('validating ' + id + ' exists');
        //find the ID in the Database
        mongoose.model('Product').findById(id, function (err, product) {
            //if it isn't found, we are going to repond with 404
            if (err) {
                console.log(id + ' was not found');
                res.status(404)
                var err = new Error('Not Found');
                err.status = 404;
                res.format({
                    html: function(){
                        next(err);
                     },
                    json: function(){
                           res.json({message : err.status  + ' ' + err});
                     }
                });
            //if it is found we continue on
            } else {
                //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
                //console.log(blob);
                // once validation is done save the new item in the req
                req.id = id;
                // go to the next thing
                next();
            }
        });
    });

    router.route('/:id')
      .get(function(req, res) {
        mongoose.model('Product').findById(req.id, function (err, product) {
          if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
          } else {
            console.log('GET Retrieving ID: ' + product._id);
            var productcreated = product.created.toISOString();
            productcreated = productcreated.substring(0, productcreated.indexOf('T'))
            res.format({
              html: function(){
                  res.render('products/show', {
                    "productcreated" : productcreated,
                    "product" : product
                  });
              },
              json: function(){
                  res.json(product);
              }
            });
          }
        });
      });

      //GET the individual blob by Mongo ID
      router.get('/:id/edit', function(req, res) {
          //search for the blob within Mongo
          mongoose.model('Product').findById(req.id, function (err, product) {
              if (err) {
                  console.log('GET Error: There was a problem retrieving: ' + err);
              } else {
                  //Return the blob
                  console.log('GET Retrieving ID: ' + product._id);
                  //format the date properly for the value to show correctly in our edit form
                var productcreated = product.created.toISOString();
                productcreated = productcreated.substring(0, productcreated.indexOf('T'))
                  res.format({
                      //HTML response will render the 'edit.jade' template
                      html: function(){
                             res.render('products/edit', {
                                title: 'Product' + product._id,
                              "productcreated" : productcreated,
                                "product" : product
                            });
                       },
                       //JSON response will return the JSON output
                      json: function(){
                             res.json(product);
                       }
                  });
              }
          });
      });

      //PUT to update a blob by ID
      router.put('/:id/edit', function(req, res) {
          // Get our REST or form values. These rely on the "name" attributes
          var name = req.body.name;
          var type = req.body.type;
          var  created = req.body.created;
          //var company = req.body.company;
          var available = req.body.available;

         //find the document by ID
              mongoose.model('Product').findById(req.id, function (err, product) {
                  //update it
                  product.update({
                    name : name,
                    type : type,
                    created : created,
                    available : available
                  }, function (err, productID) {
                    if (err) {
                        res.send("There was a problem updating the information to the database: " + err);
                    }
                    else {
                            //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                            res.format({
                                html: function(){
                                     res.redirect("/product/" + product._id);
                               },
                               //JSON responds showing the updated values
                              json: function(){
                                     res.json(product);
                               }
                            });
                     }
                  })
              });
      });

      //DELETE a Blob by ID
      router.delete('/:id/edit', function (req, res){
          //find blob by ID
          mongoose.model('Product').findById(req.id, function (err, product) {
              if (err) {
                  return console.error(err);
              } else {
                  //remove it from Mongo
                  product.remove(function (err, product) {
                      if (err) {
                          return console.error(err);
                      } else {
                          //Returning success messages saying it was deleted
                          console.log('DELETE removing ID: ' + product._id);
                          res.format({
                              //HTML returns us back to the main page, or you can create a success page
                                html: function(){
                                     res.redirect("/products");
                               },
                               //JSON returns the item with the message that is has been deleted
                              json: function(){
                                     res.json({message : 'deleted',
                                         item : product
                                     });
                               }
                            });
                      }
                  });
              }
          });
      });
module.exports = router;
