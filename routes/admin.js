const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { adminMiddleware } = require('../middleware/authMiddleware');

// Get all users (admin only)
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const users = await db.asyncAll(
            "SELECT id, username, email, has_voted, is_admin, created_at FROM users ORDER BY created_at DESC"
        );
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get statistics (admin only)
router.get('/stats', adminMiddleware, async (req, res) => {
    try {
        const stats = await db.asyncAll(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE has_voted = 1) as voted_users,
                (SELECT COUNT(*) FROM candidates) as total_candidates,
                (SELECT SUM(vote_count) FROM candidates) as total_votes
        `);
        
        const voteDistribution = await db.asyncAll(`
            SELECT c.name, c.vote_count 
            FROM candidates c 
            ORDER BY c.vote_count DESC
        `);

        res.json({
            ...stats[0],
            voteDistribution
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;