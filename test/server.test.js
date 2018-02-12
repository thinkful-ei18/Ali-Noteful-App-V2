'use strict';

/**
 * DISCLAIMER:
 * The examples shown below are superficial tests which only check the API responses.
 * They do not verify the responses against the data in the database. We will learn
 * how to crosscheck the API responses against the database in a later exercise.
 */
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiSpies = require('chai-spies');
const expect = chai.expect;
const knex = require('../knex');
const seedData = require('../db/seed');

before(function () {

});

beforeEach(function () {
  return seedData();
});

afterEach(function () {
  // noop
});

after(function () {
  // destroy the connection
  return knex.destroy();
});

chai.use(chaiHttp);
chai.use(chaiSpies);

describe('Reality check', function () {

  it('true should be true', function () {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4', function () {
    expect(2 + 2).to.equal(4);
  });

});

describe('Environment', () => {

  it('NODE_ENV should be "test"', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

  it('connection should be test database', () => {
    expect(knex.client.connectionSettings.database).to.equal('noteful_test');
  });

  it('should return the default of 10 Notes ', function () {
    let count;
    return knex.count()
      .from('notes')
      .then(([result]) => {
        count = Number(result.count);
        return chai.request(app).get('/v2/notes');
      })
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(count);
      });
  });

  it('should return correct search results for a searchTerm query', function () {
    let res;
    return chai.request(app).get('/v2/notes?searchTerm=gaga')
      .then(function (_res) {
        res = _res;
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(1);
        expect(res.body[0]).to.be.an('object');
        return knex.select().from('notes').where('title', 'like', '%gaga%');
      })
      .then(data => {
        expect(res.body[0].id).to.equal(data[0].id);
      });
  });

  it('should search by folder id', function () {
    const dataPromise = knex.select()
      .from('notes')
      .where('folder_id', 102)
      .orderBy('notes.id');

    const apiPromise = chai.request(app)
      .get('/v2/notes?folderId=102');

    return Promise.all([dataPromise, apiPromise])
      .then(function ([data, res]) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(2);
        expect(res.body[0]).to.be.an('object');
      });
  });

  it('should create and return a new item when provided valid data', function () {
    const newItem = {
      'title': 'The best article about cats ever!',
      'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
      'tags': []
    };
    let body;
    return chai.request(app)
      .post('/v2/notes')
      .send(newItem)
      .then(function (res) {
        body = res.body;
        expect(res).to.have.status(201);
        expect(res).to.have.header('location');
        expect(res).to.be.json;
        expect(body).to.be.a('object');
        expect(body).to.include.keys('id', 'title', 'content');
        return knex.select().from('note').where('id', body.id);
      })
      .then(([data]) => {
        expect(body.title).to.equal(data.title);
        expect(body.content).to.equal(data.content);
      });
  });

});



describe('Express static', function () {

  it('GET request "/" should return the index page', function () {
    return chai.request(app)
      .get('/')
      .then(function (res) {
        expect(res).to.exist;
        expect(res).to.have.status(200);
        expect(res).to.be.html;
      });
  });

});

describe('404 handler', function () {

  it('should respond with 404 when given a bad path', function () {
    const spy = chai.spy();
    return chai.request(app)
      .get('/bad/path')
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        expect(err.response).to.have.status(404);
      });
  });

});

describe('GET /v2/notes', function () {

  it('should return the default of 10 Notes ', function () {
    return chai.request(app)
      .get('/v2/notes')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
      });
  });

  it('should return a list with the correct right fields', function () {
    return chai.request(app)
      .get('/v2/notes')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        res.body.forEach(function (item) {
          expect(item).to.be.a('object');
          expect(item).to.include.keys('id', 'title', 'content');
        });
      });
  });

  it('should return correct search results for a valid query', function () {
    return chai.request(app)
      .get('/v2/notes?searchTerm=5%20cats')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(1);
        expect(res.body[0]).to.be.an('object');
        expect(res.body[0].id).to.equal(1000);
      });
  });

  it('should return an empty array for an incorrect query', function () {
    return chai.request(app)
      .get('/v2/notes?searchTerm=Not%20a%20Valid%20Search')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body).to.have.length(0);
      });
  });

});

describe('GET /v2/notes/:id', function () {

  it('should return correct notes', function () {
    return chai.request(app)
      .get('/v2/notes/1000')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.keys('id', 'title', 'content');
        expect(res.body.id).to.equal(1000);
        expect(res.body.title).to.equal('5 life lessons learned from cats');
      });
  });

  it('should respond with a 404 for an invalid id', function () {
    const spy = chai.spy();
    return chai.request(app)
      .get('/v2/notes/9999')
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        expect(err.response).to.have.status(404);
      });
  });

});
//POST
describe('POST /v2/notes', function () {

  it('should create and return a new item when provided valid data', function () {
    const newItem = {
      'title': 'The best article about cats ever!',
      'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
    };
    return chai.request(app)
      .post('/v2/notes')
      .send(newItem)
      .then(function (res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('id', 'title', 'content');

        expect(res.body.title).to.equal(newItem.title);
        expect(res.body.content).to.equal(newItem.content);
        expect(res).to.have.header('location');
      });
  });

  it('should return an error when missing "title" field', function () {
    const newItem = {
      'foo': 'bar'
    };
    const spy = chai.spy();
    return chai.request(app)
      .post('/v2/notes')
      .send(newItem)
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch((err) => {
        const res = err.response;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body.message).to.equal('Missing `title` in request body');
      });
  });

});

describe('PUT /v2/notes/:id', function () {

  it('should update the note', function () {
    const updateItem = {
      'title': 'What about dogs?!',
      'content': 'woof woof',
      'tags': []
    };
    return chai.request(app)
      .put('/v2/notes/1005')
      .send(updateItem)
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('id', 'title', 'content');

        expect(res.body.id).to.equal(1005);
        expect(res.body.title).to.equal(updateItem.title);
        expect(res.body.content).to.equal(updateItem.content);
      });
  });

  it('should respond with a 404 for an invalid id', function () {
    const updateItem = {
      'title': 'What about dogs?!',
      'content': 'woof woof',
      'tags': []
    };
    const spy = chai.spy();
    return chai.request(app)
      .put('/v2/notes/9999')
      .send(updateItem)
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        expect(err.response).to.have.status(404);
      });
  });

  it('should return an error when missing "title" field', function () {
    const updateItem = {
      'foo': 'bar'
    };
    const spy = chai.spy();
    return chai.request(app)
      .put('/v2/notes/9999')
      .send(updateItem)
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        const res = err.response;
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body.message).to.equal('Missing `title` in request body');
      });
  });

});

describe('DELETE  /v2/notes/:id', function () {

  it('should delete an item by id', function () {
    return chai.request(app)
      .delete('/v2/notes/1005')
      .then(function (res) {
        expect(res).to.have.status(204);
      });
  });

  it('should respond with a 404 for an invalid id', function () {
    const spy = chai.spy();
    return chai.request(app)
      .delete('/v2/notes/9999')
      .then(spy)
      .then(() => {
        expect(spy).to.not.have.been.called();
      })
      .catch(err => {
        expect(err.response).to.have.status(404);
      });
  });

});

describe('Get folders', function () {

  it('should return all folders with id and names', function () {
    return chai.request(app)
      .get('/v2/folders/')
      .then( response => {
        let res = response;
        expect(res).to.be.json;
      });

  });

  it('should return folders with id and name', function () {
    return chai.request(app)
      .get('/v2/folders/100')
      .then(response => {
        let res = response;
        expect(res).to.be.json;
        expect(res).to.have.status(200);
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('id', 'name');
      });

  });
});

describe('Put folders', function () {

  it('should updated folder with a new name', function () {
    const updateItem = {
      name: 'New test'
    };
    return chai.request(app)
      .put('/v2/folders/100')
      .send(updateItem)
      .then( function (res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body.name).to.equal('New test');
        expect(res.body).to.include.keys('id', 'name');
      });
      
  });

  it('should respond with error when folder name not given', function () {
    const updateItem = {
      nam: 'New test'
    };
    return chai.request(app)
      .put('/v2/folders/100')
      .send(updateItem)
      .catch(err => {
        expect(err.response).to.have.status(400);
      });
  });
});

describe('Create a new folder', function () {

  it('should create a new folder', function () {
    const updateItem = {
      name: 'New nom'
    };
    return chai.request(app)
      .post('/v2/folders/')
      .send(updateItem)
      .then( res => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.a('array');
        expect(res.body[0].name).to.equal('New nom');
        expect(res.body[0]).to.include.keys('id', 'name');
      });
  });

  it('should respond with error when folder name not given', function () {
    const Item = {
      nam: 'New test'
    };
    return chai.request(app)
      .post('/v2/folders/')
      .send(Item)
      .catch(err => {
        expect(err.response).to.have.status(400);
      });
  });
});

describe('Delete a folder', function () {
  it('should delete a folder', function () {
    return chai.request(app)
      .delete('/v2/folders/100')
      .then( res => {
        expect(res).to.have.status(204);
      });
  });

});
