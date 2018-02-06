'use strict';

const express = require('express');
const knex = require('../knex');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
/* 
const data = require('../db/notes');
const simDB = require('../db/simDB');
const notes = simDB.initialize(data);
*/

// Get All (and search by query)
/* ========== GET/READ ALL NOTES ========== */
router.get('/notes', (req, res, next) => {
  let { searchTerm } = req.query;
  if(searchTerm) {
    knex('note')
      .select()
      .where('title', 'like', `%${searchTerm}%`)
      .orWhere('content', 'like', `%${searchTerm}%`)
      .then(results => res.json(results))
      .catch(err => next(err));
  } else {
    knex('note')
      .select()
      .then(results => res.json(results))
      .catch(err => next(err));
  }
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  knex('note')
    .where({id: `${noteId}`})
    .then(result => res.json(result))
    .catch(next);
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('note')
    .where({id: `${noteId}`})
    .update(updateObj)
    .then(result => res.json(result))
    .catch(err => next(err));
});

/* ========== POST/CREATE ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content } = req.body;
  
  const newItem = { title, content };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  knex('note')
    .insert(newItem)
    .returning(['id', 'title', 'content'])
    .then(result => res.json(result))
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  knex('note')
    .where('id', noteId)
    .del()
    .then(() => res.status(204).end())
    .catch(err => next(err));
});

module.exports = router;