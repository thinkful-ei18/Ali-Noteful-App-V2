'use strict';

const express = require('express');
const knex = require('../knex');

const router = express.Router();


//Get All Folders (no searchTerm needed)

router.get('/folders', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(next);
});

//Get All folders id 

router.get('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  knex('folders')
    .where({ id: `${folderId}` })
    .then(result => res.json(result[0]))
    .catch(next);
});

//Folder Update 

router.put('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
    
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .where({ id: `${folderId}` })
    .update(updateObj)
    .then(() => {
      knex('folders')
        .where({ id: `${folderId}` })
        .then(result => res.json(result[0]))
        .catch(next);
    })
    .catch(err => next(err));
});

//Folder Create 
router.post('/folders', (req, res, next) => {
  const { name } = req.body;

  const newItem = { name };
  /***** Never trust users - validate input *****/
  if (!newItem.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  knex('folders')
    .insert(newItem)
    .returning(['id', 'name'])
    .then(result => res.json(result))
    .catch(err => next(err));
});

//Folder Delete
router.delete('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  knex('folders')
    .where('id', folderId)
    .del()
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;

