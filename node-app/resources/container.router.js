let router = require('express').Router()
const {Measurement, Event, Registry} = require('./container.models')

  


// Webservice
router.get('/allContainers', (req, res) => {
  Measurement.find({}, {"_id": 0, "containerRef": 1}, (err, docs)=>{
    res.json(docs);
  })
  //res.send('Hello World!')
})

// Webservice
router.get('/measurements/:containerId', (req, res) => {
  Measurement.findOne({"containerRef": req.params.containerId}, (err, docs)=>{
    res.json(docs);
  })
  //res.send('Hello World!')
})

//   Measurement.updateOne(
//     {containerRef: '123'},
//     {$push: {"data.temp": [{value:parseInt(message), stamp:new Date().toISOString}]}},
//     (err, res)=> {
//       if (err) console.log(`Error: ${err}`);
//       // console.log(`update result ${JSON.stringify(res)}`);
//       console.log("[Updated] TEMPERATURE data")
//     }
//   );
// }

// Testing purposes
router.get('/add', (req, res) => {
  Measurement.updateOne(
    {containerRef: '123'},
    {$push: {
      "data.temp": {
        $each: [{value:123, time:new Date().toISOString()}],
        $position: 0 // Insert at the begging of the array
      }
    }},
    (err, res) => {
      if(err) console.log(`Error: ${err}`)
      console.log("[Updated] TEMPERATURE data")
    }
  );
  res.json('ok')
});


//====== Registry ====
// Add Container
router.post('/registry/add', (req, res)=> {
  const containerRef = req.body.containerRef; // required
  const owner = req.body.owner; // required
  const location ="None" ;
  const destination = "None";
  const status = "None";
  const last_active = "None";

  const registry = new Registry({
    containerRef: containerRef,
    owner: owner,
    location: location,
    destination: destination,
    status: status,
    last_active: last_active,
  })

  registry.save((err, registry)=> {
    if(err) return console.err(err);
    console.log(`container: ${registry.containerRef} saved successfully `)
  })
});



  module.exports = router;