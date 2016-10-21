"use strict";

var express = require('express');
var router = express.Router();
var knex = require('../db/knex');
var geocoder = require('geocoder');
var bcrypt = require('bcrypt');


////// Gets jobs based on map position, optionally filtered by team //////

router.post('/jobs', function(req, res, next) {
  if (req.session.id) {
    var north = JSON.parse(req.body.bounds).north;
    var south = JSON.parse(req.body.bounds).south;
    var east = JSON.parse(req.body.bounds).east;
    var west = JSON.parse(req.body.bounds).west;
      knex('jobs')
        .join('visits', 'jobs_id', 'jobs.id')
        .where(function() {
          if (req.body.team) {
            this.where('team_id', req.body.team)
          }
        })
        .andWhere(function() {
          if (req.body.date) {
            var date = new Date(parseInt(req.body.date));
            let start = date.setHours(-96,0,0,0);
            let end = date.setHours(96,0,0,0);
            this.whereBetween('start', [start, end]);
          }
        })
        .andWhere('lat', '<', north)
        .andWhere('lat', '>', south)
        .andWhere('lng', '<', east)
        .andWhere('lng', '>', west)
        .then(function(jobs) {
          res.send(jobs);
        })
  }
});


////// Gets visits //////

router.post('/visits', function(req, res, next) {
  if (req.session.id) {
    if (req.body.team) {
      knex('visits')
        .where('team_id', req.body.team)
        .then(function(visits) {
          res.send(visits);
        })
    } else {
      knex('visits')
        .then(function(visits) {
          res.send(visits);
        })
    }
  }
});


////// Get visits for a given job ///////

router.get('/jobVisits/:jobId', function(req, res, next) {
  if (req.session.id) {
    knex('visits')
      .where('jobs_id', req.params.jobId)
      .then(function(data) {
        res.send(data);
      })
  }
});


////// Gets a list of teams //////

router.get('/teams', function(req, res, next) {
  if (req.session.id) {
    knex('teams')
      .then(function(teams) {
        res.send(teams);
      });
  }
});


////// Get visits and jobs //////

router.post('/list', function(req, res, next) {
  if (req.session.id) {
      knex('jobs')
        .join('visits', 'jobs.id', 'visits.jobs_id')
        .where(function() {
          if (req.body.team) {
            this.where('team_id', req.body.team);
          }
        })
        .where(function() {
          if (req.body.day) {
            var date = new Date(parseInt(req.body.day));
            var start = date.setHours(-96,0,0,0);
            var end = date.setHours(96,0,0,0);
            this.whereBetween('start', [start, end]);
          }
        })
        .then(function(visits) {
          res.send(visits);
        });
  }
});


////// Get job by ID //////

router.post('/printlist', function(req, res, next) {
  if (req.session.id) {
    var ids = JSON.parse(req.body.list)
    knex('jobs')
      .join('visits', 'jobs_id', 'jobs.id')
      .whereIn('visits.id', ids)
      .then(function(data) {
        res.send(data);
      });
  }
});


////// Get job by ID //////

router.get('/job/:id', function(req, res, next) {
  if (req.session.id) {
    knex('jobs')
      .where({id: req.params.id})
      .first()
      .then(function(job) {
        res.send(job);
      })
  }
});


////// Get visit by ID //////

router.get('/visit/:id', function(req, res, next) {
  if (req.session.id) {
    knex('jobs')
      .join('visits', 'jobs_id', 'jobs.id')
      .where('visits.id', req.params.id)
      .first()
      .then(function(visit) {
        res.send(visit)
      });
  }
});


////// Post new job //////

router.post('/postJob', function(req, res, next) {
  var lat, lng;
  var address = req.body.address + ', ' + req.body.city + ', ' + req.body.state + ', ' + req.body.zip;
  geocoder.geocode(address, function(err, data) {
    if (!req.body.customer_name) {
      res.send('Please add customer name.')
    }
    if (!err && data.results[0]) {
      lat = data.results[0].geometry.location.lat;
      lng = data.results[0].geometry.location.lng;
      insert();
    } else {
      res.send('Invalid address.')
    }
  });
  function insert() {
    knex('jobs')
      .insert({
        lat: lat,
        lng: lng,
        customer_name: req.body.customer_name,
        po_number: req.body.po_number,
        email: req.body.email,
        phone_number: req.body.phone_number,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        job_type: req.body.jobtype,
        priority: req.body.priority,
        notes: req.body.notes
      })
      .returning('id')
      .then(function(id) {
        knex('jobs')
          .where('id', id[0])
          .first()
          .then(function(job) {
            res.send(job);
          })
      });
  }
});


////// Update existing job //////

router.post('/updateJob', function(req, res, next) {
  if (req.session.id) {
    var lat, lng;
    var address = req.body.address + ', ' + req.body.city + ', ' + req.body.state + ', ' + req.body.zip;
    geocoder.geocode(address, function(err, data) {
      if (!req.body.customer_name) {
        res.send('Please add customer name.')
      }
      if (!err) {
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
        update();
      } else {
        res.send('Invalid address.')
      }
    });
    function update() {
      knex('jobs')
        .where('id', req.body.id)
        .update({
          lat: lat,
          lng: lng,
          customer_name: req.body.customer_name,
          po_number: req.body.po_number,
          email: req.body.email,
          phone_number: req.body.phone_number,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          job_type: req.body.job_type,
          priority: req.body.priority,
          notes: req.body.notes
        })
        .returning('id')
        .then(function(id) {
          knex('jobs')
            .where('id', id[0])
            .first()
            .then(function(job) {
              res.send(job);
            })
        });
    }
  }
});


////// Post visit //////

router.post('/postVisit', function(req, res, next) {
  if (req.session.id) {
    var start, end;
    if (req.body.date && req.body.start && req.body.end) {
      start = Date.parse(req.body.date + ', ' + req.body.start);
      end = Date.parse(req.body.date + ', ' + req.body.end);
      insertVisit();
    } else {
      res.send('Invalid date and time.')
    }
    function insertVisit() {
      knex('visits')
        .insert({
          jobs_id: req.body.jobs_id,
          visit_type: req.body.visit_type,
          start: start,
          end: end,
          team_id: req.body.team_id,
          notes: req.body.notes
        })
        .returning('id')
        .then(function(id) {
          knex('visits')
            .where('id', id[0])
            .first()
            .then(function(visit) {
              res.send(visit);
            })
        });
    }
  }
});


////// Update visit //////

router.post('/updateVisit', function(req, res, next) {
  if (req.session.id) {
    var start, end;
    if (req.body.date && req.body.start && req.body.end) {
      start = Date.parse(req.body.date + ', ' + req.body.start);
      end = Date.parse(req.body.date + ', ' + req.body.end);
      updateVisit();
    } else {
      res.send('Invalid date and time.')
    }
    function updateVisit() {
      knex('visits')
        .where('id', req.body.id)
        .update({
          jobs_id: req.body.jobs_id,
          visit_type: req.body.visit_type,
          start: start,
          end: end,
          team_id: req.body.team_id,
          notes: req.body.notes
        })
        .then(function() {
          res.send({});
        })
    }
  }
});


////// Address lookup //////

router.post('/geocode', function(req, res, next) {
  if (req.session.id) {
    let address = req.body.address + ", " + req.body.city + ", " + req.body.state + ", " + req.body.zip
    geocoder.geocode(address, function(err, data) {
      if (!err) {
        let coords = {lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng};
        res.send(coords);
      } else {
        res.send('Invalid address.')
      }
    });
  }
});


////// Search jobs //////

router.post('/search', function(req, res, next) {
  if (req.session.id) {
    var search = JSON.parse(req.body.search);
    var lat, lng, fromDate, toDate, radius;
    checkDates();
    function checkDates() {
      if (search.from && search.to) {
        fromDate = new Date(search.from);
        fromDate = fromDate.getTime();
        toDate = new Date(search.to);
        toDate = toDate.getTime() + 86400000;
        checkRadius();
      } else {
        checkRadius();
      }
    }
    // If radius specified
    function checkRadius() {
      if (search.radius) {
        if (search.address && search.city && search.state && search.zip) {
          let address = search.address + ", " + search.city + ", " + search.state + ", " + search.zip;
          geocoder.geocode(address, function(err, data) {
            if (!err) {
              lat = data.results[0].geometry.location.lat;
              lng = data.results[0].geometry.location.lng;
              search.address = null;
              search.city = null;
              search.state = null;
              search.zip = null;
              radius = parseInt(search.radius);
              searchQuery();
            } else {
              res.send({error: 'Invalid address.'});
            }
          });
        } else {
          res.send({error: 'To search by radius, please enter a full address.'});
        }
      } else {
        searchQuery();
      }
    }
    function searchQuery() {
      knex('jobs')
        .join('visits', 'jobs.id', 'visits.jobs_id')
        .where(function() {
          if (search.customer_name) {
            this.where('customer_name', search.customer_name)
          }
        }).andWhere(function() {
          if (search.po) {
            this.where('po', search.po)
          }
        }).andWhere(function() {
          if (search.priority) {
            this.where('priority', search.priority)
          }
        }).andWhere(function() {
          if (search.team_id) {
            this.where('team_id', search.team_id)
          }
        }).andWhere(function() {
          if (search.from && search.to) {
            this.whereBetween('start', [fromDate, toDate])
          }
        }).andWhere(function() {
          if (search.address) {
            this.where('address', search.address)
          }
        }).andWhere(function() {
          if (search.city) {
            this.where('city', search.city)
          }
        }).andWhere(function() {
          if (search.state) {
            this.where('state', search.state)
          }
        }).andWhere(function() {
          if (search.zip) {
            this.where('zip', search.zip)
          }
        }).andWhere(function() {
          if (search.radius) {
            this.where('lat', '<', (lat + radius/200))
              .andWhere('lat', '>', (lat - radius/200))
              .andWhere('lng', '<', (lng + radius/200))
              .andWhere('lng', '>', (lng - radius/200))
          }
        })
        .then(function(data) {
          res.send(data);
        })
  }
  }
});

router.get('/deleteVisit/:id', function(req, res, next) {
  knex('visits')
    .where('id', req.params.id)
    .del()
    .then(function() {
      res.redirect('/dashboard.html');
    });
});

router.get('/authorize', function(req, res, next) {
  res.send(req.session.isadmin);
});

router.get('/logout', function(req, res, next) {
  req.session = null;
  res.send();
});

router.post('/password', function(req, res, next) {
  if (req.body.new_password !== req.body.retype_password) {
    res.send('Passwords do not match.')
  } else {
    var password = bcrypt.hashSync(req.body.new_password, 8);
  }
  knex('users')
    .where('email', req.body.email)
    .then(function(data) {
      if (!data.length) {
        res.send('Please enter a valid login.')
      } else if (bcrypt.compareSync(req.body.old_password, data[0].password)) {
        knex('users')
          .where('email', req.body.email)
          .first()
          .update({
            password: password
          }).then(function() {
            res.redirect('/dashboard.html')
          });
      } else {
        res.send('Please enter a valid login.');
      }
    })
});


module.exports = router;
