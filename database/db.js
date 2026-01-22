const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Database path
const dbPath = path.join(__dirname, 'voting.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
function initializeDatabase() {
    console.log('🔄 Initializing database...');
    
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        has_voted BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Candidates table
    db.run(`CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        vote_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Votes table
    db.run(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        candidate_id INTEGER NOT NULL,
        voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE,
        UNIQUE(user_id)
    )`);

    // Insert default admin user
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.get("SELECT COUNT(*) as count FROM users WHERE username = 'admin'", (err, row) => {
        if (err) {
            console.error('Error checking admin:', err);
            return;
        }
        
        if (row.count === 0) {
            db.run(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                ['admin', 'admin@voting.com', defaultPassword],
                (err) => {
                    if (err) console.error('Error creating admin:', err);
                    else console.log('✅ Admin user created (username: admin, password: admin123)');
                }
            );
        }
    });

    // Insert sample candidates
    db.get("SELECT COUNT(*) as count FROM candidates", (err, row) => {
        if (err) {
            console.error('Error checking candidates:', err);
            return;
        }
        
        if (row.count === 0) {
            const candidates = [
                [
                    'Emil Shain', 
                    'Emil Shain is a B.Tech CSE student at Christ College of Engineering, Irinjalakuda. A passionate Frontend Developer and skilled graphic designer.', 
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
                ],
                [
                    'Justine Krieger', 
                    'Justine Krieger is a software engineer with over 10 years of experience in the field. He is a strong advocate for diversity and inclusion in the workplace.', 
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
                ],
                [
                    'Sarah Johnson', 
                    'Sarah is a product manager with expertise in building user-centric applications. She believes in transparent governance.', 
                    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w-400&h=400&fit=crop'
                ],
                [
                    'Michael Chen', 
                    'Michael is a data scientist passionate about using analytics to improve community decision-making processes.', 
                    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
                ]
            ];
            
            const stmt = db.prepare("INSERT INTO candidates (name, description, image_url) VALUES (?, ?, ?)");
            candidates.forEach(candidate => {
                stmt.run(candidate, (err) => {
                    if (err) console.error('Error inserting candidate:', err);
                });
            });
            stmt.finalize();
            console.log(`✅ ${candidates.length} sample candidates inserted`);
        }
    });

    console.log('✅ Database initialized successfully');
}

// Promisified database methods
db.runAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

db.getAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

db.allAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Initialize database on startup
db.serialize(() => {
    initializeDatabase();
});

module.exports = db;