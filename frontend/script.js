document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Helper functions
    function showMessage(message, type = 'info') {
        alert(`${type.toUpperCase()}: ${message}`);
    }

    function navigateTo(url) {
        window.location.href = url;
    }

    function getToken() {
        return localStorage.getItem('token');
    }

    function getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    function setUserData(user, token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    }

    function clearUserData() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    function isAuthenticated() {
        return getToken() !== null;
    }

    function checkAuthAndRedirect() {
        if (!isAuthenticated() && !window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html') && 
            !window.location.pathname.includes('forgotPassword.html')) {
            navigateTo('login.html');
        }
    }

    // Check authentication on page load
    checkAuthAndRedirect();

    // Update navbar with username
    const userSpans = document.querySelectorAll('.navbar span:first-child');
    const user = getUser();
    if (user && userSpans.length > 0) {
        userSpans.forEach(span => {
            span.textContent = user.username;
        });
    }

    // --- LOGIN PAGE ---
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    setUserData(data.user, data.token);
                    showMessage('Login successful!', 'success');
                    navigateTo('vote.html');
                } else {
                    showMessage(data.error || 'Login failed', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
    }

    // --- REGISTER PAGE ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            if (password !== confirmPassword) {
                showMessage('Passwords do not match!', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, confirmPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage('Registration successful! Please login.', 'success');
                    navigateTo('login.html');
                } else {
                    showMessage(data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
    }

    // --- FORGOT PASSWORD ---
    if (document.title.includes('Forgot Password')) {
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = form.username.value;

                // In a real app, you would use email
                showMessage('Password reset feature coming soon. For now, contact admin.', 'info');
                navigateTo('login.html');
            });
        }
    }

    // --- VOTE PAGE ---
    if (document.title.includes('Candidates')) {
        // Load candidates
        loadCandidates();
        
        // Setup vote buttons
        setupVoteButtons();
    }

    // --- VOTERS PAGE ---
    if (document.title.includes('Voters')) {
        loadVoters();
    }

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearUserData();
            navigateTo('login.html');
        });
    }

    // Helper function to load candidates
    async function loadCandidates() {
        try {
            const response = await fetch(`${API_BASE_URL}/vote/candidates`);
            const data = await response.json();

            if (response.ok && data.candidates) {
                const candidatesContainer = document.querySelector('.candidates');
                if (candidatesContainer && data.candidates.length > 0) {
                    // Update existing candidates or create new ones
                    updateCandidateDisplay(data.candidates);
                }
            }
        } catch (error) {
            console.error('Failed to load candidates:', error);
        }
    }

    function updateCandidateDisplay(candidates) {
        // For now, we'll just log the candidates
        // In a real app, you would dynamically update the DOM
        console.log('Loaded candidates:', candidates);
    }

    function setupVoteButtons() {
        const voteBtns = document.querySelectorAll('.voteBtn');
        voteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                if (!isAuthenticated()) {
                    showMessage('Please login to vote', 'error');
                    navigateTo('login.html');
                    return;
                }

                const card = e.target.closest('.candidate');
                const candidateId = card.id.replace('cand', ''); // Assuming IDs like cand1, cand2
                const candidateName = card.querySelector('h2').textContent;

                // Check if already voted
                try {
                    const user = getUser();
                    if (user && user.hasVoted) {
                        showMessage('You have already voted!', 'error');
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/vote/vote`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify({ candidateId })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        showMessage(`Vote cast for ${candidateName}!`, 'success');
                        // Update user data
                        if (data.hasVoted) {
                            const user = getUser();
                            user.hasVoted = true;
                            setUserData(user, getToken());
                        }
                        navigateTo('voters.html');
                    } else {
                        showMessage(data.error || 'Failed to cast vote', 'error');
                    }
                } catch (error) {
                    showMessage('Network error. Please try again.', 'error');
                }
            });
        });
    }

    async function loadVoters() {
        try {
            const response = await fetch(`${API_BASE_URL}/vote/voters`);
            const data = await response.json();

            if (response.ok && data.voters) {
                const votersList = document.querySelector('.voters');
                if (votersList && data.voters.length > 0) {
                    // Clear existing list items
                    votersList.innerHTML = '';
                    
                    // Add new voters
                    data.voters.forEach(voter => {
                        const li = document.createElement('li');
                        li.textContent = `${voter.username} voted for ${voter.candidate_name}`;
                        votersList.appendChild(li);
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load voters:', error);
        }
    }

    // OAuth buttons (mock)
    const oauthBtns = document.querySelectorAll('.oauth button');
    oauthBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const provider = btn.innerText.includes('Google') ? 'Google' : 'LinkedIn';
            showMessage(`${provider} login not implemented yet`, 'info');
        });
    });
});