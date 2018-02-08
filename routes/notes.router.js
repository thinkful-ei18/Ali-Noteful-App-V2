'use strict';

const express = require('express');
const knex = require('../knex');
const Treeize = require('treeize');

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
router.get('/notes', (req, res) => {
  let { searchTerm } = req.query;
  let { tagId } = req.query;
  knex
    .select('note.id', 'title', 'content', 'created', 'folder_id', 'folders.name as folder_name', 'tags.name as tags_name', 'tags.id as tags_id')
    .from('note')
    .leftJoin('folders', 'note.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'note.id', 'notes_tags.note_id') 
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where(function () {
      if (req.query.folderId) {
        this.where('folder_id', req.query.folderId);
      }
    })
    .where(function () {
      if (tagId) {
        const subQuery = knex.select('note.id')
          .from('note')
          .innerJoin('notes_tags', 'note.id', 'notes_tags.note_id')
          .where('notes_tags.tag_id', tagId);
        this.whereIn('note.id', subQuery);
      }
    })
    .where(function () {
      if (searchTerm) {
        this.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .orderBy('note.id')
    .then(results => {
      const treeize = new Treeize();
      treeize.grow(results);
      const hydrated = treeize.getData();
      res.json(hydrated);
    })
    .catch(err => {
      console.error(err);
    });
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/notes/:id', (req, res) => {
  const noteId = req.params.id;
  knex
    .select('note.id', 'title', 'content', 'created', 'folder_id', 'folders.name as folder_name', 'tags.name as tags_name', 'tags.id as tags_id')
    .from('note')
    .where({'note.id': `${noteId}`})
    .leftJoin('folders', 'note.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'note.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .then(results => {
      const treeize = new Treeize();
      treeize.grow(results);
      const hydrated = treeize.getData();
      res.json(hydrated[0]);
    })
    .catch(err => {
      console.error(err);
      res.sendStatus(500);
    });
});


/* ========== POST/CREATE ITEM ========== */
router.post('/notes', (req, res) => {
  const { title, content, folder_id } = req.body; 
 
  const newItem = {
    title: title,
    content: content,
    folder_id: folder_id  
  };

  let noteId;

  knex.insert(newItem)
    .into('note')
    .returning('id')
    .then(([id]) => {
      noteId = id;
      return knex.select('note.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
        .from('note')
        .leftJoin('folders', 'note.folder_id', 'folders.id')
        .where('note.id', noteId);
    })
    .then(([result]) => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      console.error(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folder_id'];

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
    .where({ id: `${noteId}` })
    .update(updateObj)
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