'use strict';

const knex = require('../../knex');

function seedDataFolders() {
  const folders = require('./folders');
  return knex('folders').del()
    .then(() => knex('folders').insert(folders));
}

function seedDataTags() {
  const tags = require('./tags');
  return knex('tags').del()
    .then(() => knex('tags').insert(tags));
}

function seedDataNotes() {
  const notes = require('./notes');
  return knex('note').del()
    .then(() => knex('note').insert(notes));
}

function seedDataNotesTags() {
  const notes_tags = require('./notes_tags');
  return knex('notes_tags').del()
    .then(() => knex('notes_tags').insert(notes_tags));
}

function seedData() {
  return Promise.all([seedDataFolders(), seedDataTags()])
    .then(() => seedDataNotes())
    .then(() => seedDataNotesTags());
}

module.exports = seedData;