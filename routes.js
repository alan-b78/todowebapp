const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const uuid = require('uuid');
const db = require('./db');
const bcryptUtils = require('./bcryptUtils');
const sanitiseHTML = require('sanitize-html');
const winston = require('winston');

const router = express.Router();

const conn = db.getConnection();

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log' })
  ]
});

// Create tables if they don't exist
db.createTables(conn);

router.get('/', (req, res) => {   
    res.render('login', { csrfToken: req.csrfToken() });
});

router.get('/signup', (req, res) => {
    
  res.render('signup', { csrfToken: req.csrfToken() });
});

router.get('/contact', (req, res) => {
    
  res.render('contact-us', { csrfToken: req.csrfToken() });
});

router.get('/add_todo', (req, res) => {
  if (!req.session.loggedIn) {
    // Redirect to login if not logged in
    return res.redirect('/');
  }

  res.render('add_todo', { role: req.session.role, csrfToken: req.csrfToken() });
});

router.post('/login', (req, res) => {
  
  const { username, password } = req.body;

  // Check credentials against hashed password in the database
  const sql = 'SELECT * FROM usersAndRoles WHERE username = ?';

  conn.query(sql, [username], (err, results) => {
    if (err) {
      //console.error('Error executing login query:', err);
      logger.error('Error executing login query:', err);
      return res.status(500).send('Error logging in.');
    }

    if (results.length === 0) {
      return res.status(401).send('Invalid credentials.');
    }

    const hashedPassword = results[0].todo_password;
    const userRole = results[0].role_name;

    if (bcryptUtils.comparePasswords(password, hashedPassword)) {
      req.session.username = username;
      req.session.role = userRole; 
      req.session.loggedIn = true;
      // Passwords match, redirect to dashboard
      res.redirect('/add_todo');
    } else {
      // Passwords do not match
      res.status(401).send('Invalid credentials.');
      res.redirect('/');
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = bcryptUtils.hashPassword(password);
  const userRole = 'user';

  const sql = 'INSERT INTO usersAndRoles (username, todo_password, role_name) VALUES (?, ?, ?)';
  conn.query(sql, [username, hashedPassword, userRole], (err, result) => {
    if (err) {
      const errorReference = uuid.v4();
      logger.error(`Error creating user (Reference: ${errorReference}):`, err);
      return res.status(500);
    }
    logger.info('User created successfully:', result);
    res.redirect('/?registered=true');
  });
});

router.post('/contact-us', (req, res) => {
  const {email, message } = req.body;

  const hashedEmail = bcryptUtils.hashPassword(email);
  const sanitiseMessage = sanitiseHTML(message);

  const queryString = 'INSERT INTO contacts (email, message) VALUES (?, ?)';
  conn.query(queryString, [hashedEmail, sanitiseMessage], (err, results) => {
      if (err) {
          logger.error('Error occurred while saving contact:', err);
          // console.error('Error occurred while saving contact:', err);
          res.status(500).send('Error occurred while saving contact');
      } else {
          logger.info('Contact saved successfully');
          // console.log('Contact saved successfully');
          res.status(200).send('Contact saved successfully');
      }
  });
});

router.get('/admin', (req, res) => {
  const loggedIn = req.session.loggedIn || false;
  
  // Check if user is logged in
  if (!req.session.loggedIn) {
      // Redirect to login page if not logged in
      return res.redirect('/'); 
  }

  // Check if user has admin role
  if (req.session.role !== 'admin') {
      // Redirect to main app page if not an admin
      return res.redirect('/admin'); 
  }

  console.log("In the admin route before the query.");
  // User is logged in and has admin role, proceed to fetch user list
  conn.query('SELECT username, role_name FROM usersAndRoles', (error, results, fields) => {
      if (error) {
          logger.error(error);
          // console.error(error);
          return res.status(500).send('Internal Server Error');
      }
      res.render('admin', { users: results });
  });
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session:', err);
          //console.error('Error destroying session:', err);
          return res.status(500).send('Error logging out.');
      }
      res.redirect('/'); 
  });
});

router.get('/get_todos', (req, res) => {
  const username = req.session.username;
  const queryString = "SELECT * FROM todo where complete = '0' AND created_by = ?";
  conn.query(queryString, [username], (err, rows, fields) => {
      if (err) {
          logger.info("Failed to query @ /get_todo: +" + err); 
          // console.log("Failed to query @ /get_todo: +" + err);
      }
      logger.info("Getting data from database @ /get_todos");
      //console.log("Getting data from database @ /get_todos");
      res.json(rows);
  });
});

router.post('/add_todo', (req, res) => {
  if (!req.session.loggedIn) {
    // Redirect to login if not logged in
    return res.redirect('/');
  }

  const todo = req.body.add_todo_input;
  const username = req.session.username;
  const sanitisedTodo = sanitiseHTML(todo);

  const queryString = "INSERT INTO todo (todo, created_by) VALUES (?, ?)";
  conn.query(queryString, [sanitisedTodo, username], (err, rows, fields) => {
      if(err){
          logger.info("Failed to insert @ /add_todo: +" + " " + err);
          // console.log("Failed to insert @ /add_todo: +" + " " + err);
      }
      logger.info("@/add_todo : " + todo + " added.");
      // console.log("@/add_todo : " + todo + " added.");
      res.redirect('/add_todo');
  });
});

router.post('/complete_todo/:id', (req, res) => {
  const todo_id = req.params.id;
  const queryString = "UPDATE todo SET complete = '1' WHERE todo_id = ?";
  conn.query(queryString, [todo_id], (err, rows, fields) => {
      if (err){
          logger.info("Failed to complete todo @ /complete_todo: " + todo_id + " " + err);
          // console.log("Failed to complete todo @ /complete_todo: " + todo_id + " " + err);
      }
  });
  logger.info("@/complete_todo/ completing todo with id " + todo_id);
  //console.log("@/complete_todo/ completing todo with id " + todo_id);
  res.redirect('/add_todo');
});

router.post('/update_todo/:id', (req, res) => {
  
  const todo_id = req.params.id;
  const todo_Message = req.body.todo_message;
  const sanitiseTodoMessage = sanitiseHTML(todo_Message);

  const queryString = "UPDATE todo SET todo = ? WHERE todo_id = ?";
  conn.query(queryString, [sanitiseTodoMessage, todo_id], (err, rows, fields) => {
      if(err){
          logger.info("Failed to update todo @ /update_todo: " + todo_id);
          // console.log("Failed to update todo @ /update_todo: " + todo_id);
      }
  });
  logger.info("@/update_todo/ updating todo with message " + todo_Message);
  // console.log("@/update_todo/ updating todo with message " + todo_Message);
  res.redirect('/add_todo');
});

router.post('/delete_todo/:id', (req, res) => {
  const todo_id = req.params.id;
  const queryString = "DELETE FROM todo WHERE todo_id = ?;";
  conn.query(queryString, [todo_id], (err, rows, fields) => {
      if(err){
          logger.info("Failed to delete todo @ /delete_todo: " + todo_id);
          // console.log("Failed to delete todo @ /delete_todo: " + todo_id);
      }
  });
  logger.info("@/delete_todo/ deleting todo with id " + todo_id);   
 // console.log("@/delete_todo/ deleting todo with id " + todo_id);   
  res.redirect('/add_todo');
});

module.exports = router;