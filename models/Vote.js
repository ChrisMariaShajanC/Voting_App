const db = require('../database/db');

class Vote {
    // Cast a vote
    static async castVote(userId, candidateId) {
        // Check if user has already voted
        const existingVote = await db.getAsync(
            "SELECT * FROM votes WHERE user_id = ?",
            [userId]
        );

        if (existingVote) {
            throw new Error('You have already voted');
        }

        // Start transaction
        await db.runAsync("BEGIN TRANSACTION");

        try {
            // Insert vote
            await db.runAsync(
                "INSERT INTO votes (user_id, candidate_id) VALUES (?, ?)",
                [userId, candidateId]
            );

            // Update candidate vote count
            await db.runAsync(
                "UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?",
                [candidateId]
            );

            // Mark user as voted
            await db.runAsync(
                "UPDATE users SET has_voted = 1 WHERE id = ?",
                [userId]
            );

            await db.runAsync("COMMIT");
            return true;
        } catch (error) {
            await db.runAsync("ROLLBACK");
            throw error;
        }
    }

    // Get all candidates
    static async getCandidates() {
        return await db.allAsync(
            "SELECT * FROM candidates ORDER BY vote_count DESC"
        );
    }

    // Get candidate by ID
    static async getCandidateById(id) {
        return await db.getAsync(
            "SELECT * FROM candidates WHERE id = ?",
            [id]
        );
    }

    // Get voters list
    static async getVoters() {
        return await db.allAsync(`
            SELECT 
                u.username,
                c.name as candidate_name,
                v.voted_at
            FROM votes v
            JOIN users u ON v.user_id = u.id
            JOIN candidates c ON v.candidate_id = c.id
            ORDER BY v.voted_at DESC
        `);
    }

    // Get voting results
    static async getResults() {
        return await db.allAsync(`
            SELECT 
                c.id,
                c.name,
                c.description,
                c.image_url,
                c.vote_count,
                COUNT(v.id) as total_votes
            FROM candidates c
            LEFT JOIN votes v ON c.id = v.candidate_id
            GROUP BY c.id
            ORDER BY c.vote_count DESC
        `);
    }

    // Check if user has voted
    static async hasUserVoted(userId) {
        const result = await db.getAsync(
            "SELECT has_voted FROM users WHERE id = ?",
            [userId]
        );
        return result ? result.has_voted : false;
    }

    // Get total votes
    static async getTotalVotes() {
        const result = await db.getAsync(
            "SELECT COUNT(*) as total FROM votes"
        );
        return result.total;
    }
}

module.exports = Vote;