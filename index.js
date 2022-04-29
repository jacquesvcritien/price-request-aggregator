var express = require('express');
var app = express();
const request = require("request");
var bodyParser = require('body-parser')
const bridges = require('./bridges.json')
const fs = require('fs')


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/**
 * Method to get value at path from passed response
 * @param {*} response response from request
 * @param {*} path path array to traverse
 * @returns value at the specified path
 */
function getResultAtPath(response, path){

    for(var i=0; i < path.length; i++){

        if(typeof response[path[i]] == "undefined")
            throw "Path does not exist in response"

        response = response[path[i]]
    }
    return response
   
}

/**
 * Method to handle GET request
 * @param {*} req 
 * @returns result in sprecified path
 */
async function handleGet(req){

    var url = req.url.startsWith("bridge-") ? bridges[req.url] : req.url;

    if (!url || url == "" ){
        throw "Bridge does not exist"
    }

    const options = {
        url: url,
        method: 'GET',
    };
    
    // Return new promise
    return new Promise(function(resolve, reject) {
        // Do async job
        request.get(options, function(err, resp, body) {
            if (err) {
                reject(err.code);
            } else {
                
                //if not 200
                if (resp.statusCode != 200){
                    reject(resp.statusMessage)
                }

                try{
                    var result = getResultAtPath(JSON.parse(body), req.resultPath)
                    resolve(result);
                }
                catch(err){
                    reject(err);
                }
            }
        })
    })
}

/**
 * Method to handle POST request
 * @param {*} req 
 * @returns result in sprecified path
 */
 async function handlePost(req){

    var url = req.url.startsWith("bridge-") ? bridges[req.url] : req.url;

    if (!url || url == "" ){
        throw "Bridge does not exist"
    }

    const options = {
        url: url,
        body: JSON.stringify(req.data),
        method: 'POST',        
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    // Return new promise
    return new Promise(function(resolve, reject) {
        // Do async job
        request.post(options, function(err, resp, body) {
            if (err) {
                reject(err.code);
            } else {
                
                //if not 200
                if (resp.statusCode != 200){
                    reject(resp.statusMessage)
                }

                try{
                    var result = getResultAtPath(JSON.parse(body), req.resultPath)
                    resolve(result);
                }
                catch(err){
                    reject(err);
                }
            }
        })
    })
}

/**
 * Function to calculate median
 * @credits https://stackoverflow.com/questions/45309447/calculating-median-javascript 
 * @param {*} numbers array of values 
 * @returns median
 */
function median(numbers) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

/**
 * Method to update config file
 * @param {*} newValue new values
 */
 async function updateBridges(config){
    console.log(JSON.stringify(config))
    fs.writeFile('./bridges.json', JSON.stringify(config), (err) => { 
        if(err)
            console.log("Bridges file update failed", err);
     });
}

//method to add new bridge
app.post('/upsertBridge', async (req, res) => {
    var name = req.body.name;
    var url = req.body.url;

    //if required params are not passed
    if(!name || name == "" || !url || url == ""){
        return res.status(400).json({
            success:false,
            error: "You need to pass in a name and a url"
        })
    }

    //if name does not start in bridge-
    if(!name.startsWith("bridge-")){
        return res.status(400).json({
            success:false,
            error: "Bridge name must start with bridge-"
        })
    }
    
    //add new keyword
    bridges[name] = url

    //update file
    await updateBridges(bridges); 

    return res.send(name+' upserted to bridges')

})

//method to remove a bridge
app.post('/removeBridge', async (req, res) => {
    var name = req.body.name;

    //if required params are not passed
    if(!name || name == ""){
        return res.status(400).json({
            success:false,
            error: "You need to pass in a name"
        })
    }

    //if name does not start in bridge-
    if(!name.startsWith("bridge-")){
        return res.status(400).json({
            success:false,
            error: "Bridge name must start with bridge-"
        })
    }

    //if name does not sexit
    if(!bridges[name]){
        return res.status(400).json({
            success:false,
            error: name + " does not exist"
        })
    }

    //delete bridge
    delete bridges[name];

    //update file
    await updateBridges(bridges); 

    return res.send(name+' removed from bridges')
})




app.post('/request', async function (req, res) {
    const requests = req.body;

    var all_values = []
    var correct_values = []
    var statuses = []
    var success = false;

    //if no request
    if (requests.len == 0){
        return res.status(400).json({
            success:false,
            error: "Pass in an array of requests"
        })
    }

    //for each request
    for (var i=0; i < requests.length; i++){
        var request = requests[i];

        var value;

        try{
            switch(request.type){
                case 'GET': value = await handleGet(request);break;
                case 'POST': value = await handlePost(request);break
            }

            correct_values.push(value)
            all_values.push(value)
            statuses.push({success: true})
            success = true;
        }
        catch(err){
            console.log("ERROR",err)
            all_values.push("N/A")
            statuses.push({success: false, error: err})
        }

    }

    //if there was 1 successful request, get median
    var med = median(correct_values)

    if(success)
        return res.status(200).json({
            success:true,
            median: med,
            all_values: all_values,
            statuses: statuses
        })
    else
        return res.status(200).json({
            success:false,
            all_values: all_values,
            statuses: statuses
        })
})

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Listening at http://%s:%s", host, port)
})