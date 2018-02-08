'use strict';

const express = require('express');
const knex = require('../knex');

const router = express.Router();

//GET all tags
router.get('/tags', (req, res, next) => {
  knex.select('name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

module.exports = router;