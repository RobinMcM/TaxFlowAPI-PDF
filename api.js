const dboperations = require('./dbOperations');

var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
const req = require('express/lib/request');
var app = express();
var router = express.Router();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use('/api', router);

router.route('/ClientToken/:id').get((request,response)=>{
    dboperations.getClientToken(request.params.id).then(result => {
        response.json(result[0]);
    })
});

router.route('/CompanyToken/:id').get((request,response)=>{
    dboperations.getCompanyToken(request.params.id).then(result => {
        response.json(result[0]);
    })
});

router.route('/AideMemoire/:id').get((request,response)=>{
    dboperations.getClientAideMemoire(request.params.id).then(result => {
        response.json(result[0]);
    })
});

router.route('/AideMemoireDisabled/:id').get((request,response)=>{
    dboperations.getClientAidememoireDisabled(request.params.id).then(result => {
        response.json(result[0]);
    })
});

router.route('/AideMemoireNotRequired/:id').get((request,response)=>{
    dboperations.getClientAidememoireNotRequired(request.params.id).then(result => {
        response.json(result[0]);
    })
});

var port = process.env.PORT || 8900;

app.listen(port);
console.log(`AideMemoire API listening on ${port}`);


