#price-request-aggregator

This is a repository built to facilitate the aggregation of prices from different sources when creating V1 Chainlink Jobs.

## How to add/edit a bridge

Make a POST request to <b>/upsertBridge</b> with the following data
```js
{
    //bridge name - must start with bridge-
    "name": "bridge-name",
    //url of chainlink external adapter - a list of these can be obtained from here
    //https://github.com/smartcontractkit/external-adapters-js/tree/develop/packages/sources
    "url": "url"
}
```

## How to remove a bridge

Make a POST request to <b>/removeBridge</b> with the following data
```js
{
    //bridge name - must start with bridge-
    "name": "bridge-name"
}
```

## Alternative method

You can also edit these bridges by changing the <b>bridges.json</b> file.

Every bridge should follow the following structure

```js
{
    "bridge-name": "url
}
```

## How to make a request to multiple sources and get back a median result

Make a POST request to <b>/request</b> with an arrya of requests.

Note: For each request, a separate object must be added

### To make a GET request

You should add the following request object to the array

```js
//example of GET request
{
    //type of request
    "type": "GET",
    //the url of the endpoint to hit
    //you can also use the bridge name if you added the bridge to the list of bridges
    "url": "url",
    //the path to the result
    //example, if we want to extarct the value from data.result.value
    "resultPath": ["data", "result", "value"]
}
```

### To make a POST request

You should add the following request object to the array


```js
//example of POST request
{
    //type of request
    "type": "POST",
    //the url of the endpoint to hit
    //you can also use the bridge name if you added the bridge to the list of bridges
    "url": "url",
    //a json object representing the data to send in the request
    "data": {
        "json": "object"
    },
    //the path to the result
    //example, if we want to extarct the value from data.result.value
    "resultPath": ["data", "result", "value"]
}
```

### Request response

A request will return the following structure

```js
{
    //success value
    "success": true|false,
    //median value
    "median": Value,
    //each value returned by each request
    "all_values": [
        Value1,
        Value2,
        Value3
    ],
    //status for each request
    "statuses": [
        {
            "success": true,
        },
        {
            "success": true
        },
        {
            "success": true
        }
    ]
}
```

## Request example

<b>Request</b>

```js
//request
[
    {
        "type": "POST",
        "url": "bridge-nomics",
        "data": {
            "id": "1",
            "data": {
                "endpoint": "crypto",
                "resultPath": "price",
                "base": "ATOM",
                "quote": "USD"
            }
        },
        "resultPath": ["result"]
    },
    {
        "type": "POST",
        "url": "bridge-coinmetrics",
        "data": {
            "id": "1",
            "data": {
                "endpoint": "price",
                "base": "ATOM",
                "quote": "USD"
            }
        },
        "resultPath": ["result"]
    },
    {
        "type": "POST",
        "url": "bridge-tiingo",
        "data": {
            "id": "1",
            "data": {
                "base": "ATOM",
                "quote": "USD"
            }
        },
        "resultPath": ["result"]
    }
]
```


<b>Response</b>

```js
//response
{
    "success": true,
    "median": 20.22733337623318,
    "all_values": [
        20.26321208,
        20.06,
        20.22733337623318
    ],
    "statuses": [
        {
            "success": true
        },
        {
            "success": true
        },
        {
            "success": true
        }
    ]
}
```