const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Get all candidates
router.get('/candidates', async (req, res) => {
    try {
        const candidates = await Vote.getCandidates();
        res.json({
            success: true,
            candidates
        });
    } catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

// Cast a vote
router.post('/vote', authMiddleware, async (req, res) => {
    try {
        const { candidateId } = req.body;
        const userId = req.user.id;

        if (!candidateId) {
            return res.status(400).json({ error: 'Candidate ID is required' });
        }

        // Check if user has already voted
        if (req.user.has_voted) {
            return res.status(400).json({ error: 'You have already voted' });
        }

        // Check if candidate exists
        const candidate = await Vote.getCandidateById(candidateId);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        // Cast vote
        await Vote.castVote(userId, candidateId);

        res.json({
            success: true,
            message: 'Vote cast successfully!',
            hasVoted: true
        });
    } catch (error) {
        console.error('Vote error:', error);
        
        if (error.message === 'You have already voted') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to cast vote' });
        }
    }
});

// Get voters list
router.get('/voters', async (req, res) => {
    try {
        const voters = await Vote.getVoters();
        res.json({
            success: true,
            voters
        });
    } catch (error) {
        console.error('Get voters error:', error);
        res.status(500).json({ error: 'Failed to fetch voters' });
    }
});

// Get voting results
router.get('/results', async (req, res) => {
    try {
        const results = await Vote.getResults();
        const totalVotes = await Vote.getTotalVotes();
        
        res.json({
            success: true,
            results,
            totalVotes
        });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Check vote status
router.get('/check-vote', authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            hasVoted: req.user.has_voted
        });
    } catch (error) {
        console.error('Check vote error:', error);
        res.status(500).json({ error: 'Failed to check vote status' });
    }
});

module.exports = router;