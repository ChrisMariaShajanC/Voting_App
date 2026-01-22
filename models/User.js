const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
    // Create new user
    static async create(username, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.runAsync(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );
        return result.id;
    }

    // Find user by username
    static async findByUsername(username) {
        return await db.getAsync("SELECT * FROM users WHERE username = ?", [username]);
    }

    // Find user by email
    static async findByEmail(email) {
        return await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);
    }

    // Find user by ID
    static async findById(id) {
        return await db.getAsync(
            "SELECT id, username, email, has_voted, created_at FROM users WHERE id = ?",
            [id]
        );
    }

    // Verify password
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    // Update password
    static async updatePassword(userId, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.runAsync(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );
    }

    // Mark user as voted
    static async markAsVoted(userId) {
        await db.runAsync(
            "UPDATE users SET has_voted = 1 WHERE id = ?",
            [userId]
        );
    }

    // Generate JWT token
    static generateToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                hasVoted: user.has_voted 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    // Verify token
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}

module.exports = User;