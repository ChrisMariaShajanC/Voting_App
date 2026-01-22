require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Import database and routes
const db = require('./database/db');
const authRoutes = require('./routes/auth');
const voteRoutes = require('./routes/vote');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vote', voteRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Voting API is running',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend HTML files
app.get('*', (req, res) => {
    const filePath = path.join(frontendPath, req.path === '/' ? 'login.html' : req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.sendFile(filePath);
    } else {
        // For SPA-like behavior, redirect to login for unknown routes
        res.redirect('/login.html');
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Frontend served from: ${frontendPath}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});