'use strict';

const express = require('express');
const router = express.Router();

const knex = require('../knex');
const {UNIQUE_VIOLATION} = require('pg-error-constants');


//GET all tags
router.get('/tags', (req, res, next) => {
  knex('tags')
    .select('name', 'id')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

//GET all tags by ID
router.get('/tags/:id', (req, res, next) => {
  knex.select('id', 'name')
    .where('id', req.params.id)
    .from('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

//CREATE TAG 
router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  
  const newItem = { name };

  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then(([result]) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === UNIQUE_VIOLATION && err.constraint === 'tags_name_key') {
        err = new Error('Tags name is already taken');
        err.status = 409;
      }
      next(err);
    });
});



//UPDATE TAG
router.put('/tags/:id', (req, res, next) => {
  const tagId = req.params.id;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['name', 'id'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.name) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('tags')
    .where({ id: `${tagId}` })
    .update(updateObj)
    .then(result => res.json(result))
    .catch(err => {
      if (err.code === UNIQUE_VIOLATION && err.constraint === 'tags_name_key') {
        err = new Error('Tags name is already taken');
        err.status = 409;
      }
      next(err);
    });
});

//DELETE TAG
router.delete('/tags/:id', (req, res, next) => {
  const tagId = req.params.id;
  knex('tags')
    .where('id', tagId)
    .del()
    .then(() => res.status(204).end())
    .catch(err => next(err));
});


module.exports = router;