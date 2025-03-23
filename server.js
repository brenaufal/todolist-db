// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi ke database
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todolist-db'
  });

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Routes

// GET - Ambil semua tasks
app.get('/api/tasks', (req, res) => {
  db.query('SELECT * FROM tasks ORDER BY created_at DESC', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// POST - Tambah task baru
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  db.query('INSERT INTO tasks (title) VALUES (?)', [title], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Ambil task yang baru ditambahkan
    db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(rows[0]);
    });
  });
});

// PUT - Update task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  
  db.query(
    'UPDATE tasks SET title = ?, completed = ? WHERE id = ?',
    [title, completed, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Ambil task yang sudah diupdate
      db.query('SELECT * FROM tasks WHERE id = ?', [id], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }
        res.json(rows[0]);
      });
    }
  );
});

// DELETE - Hapus task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully', id });
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});