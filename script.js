// Firebase configuration - Replace with your actual config
const firebaseConfig = {
    apiKey: "AIzaSyABC123XYZ456DEF789GHI",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456ghi789jkl"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const loginContent = document.querySelector('.auth-content');
const signupContent = document.getElementById('signupContent');
const appContainer = document.getElementById('appContainer');
const logoutBtn = document.getElementById('logoutBtn');
const postInput = document.getElementById('postInput');
const postsContainer = document.getElementById('postsContainer');
const photoVideoOption = document.getElementById('photoVideoOption');
const postImageInput = document.getElementById('postImageInput');
const createStoryBtn = document.getElementById('createStory');

// Show auth modal by default
window.onload = function() {
    authModal.style.display = 'flex';
};

// Toggle between login and signup forms
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginContent.style.display = 'none';
    signupContent.style.display = 'block';
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupContent.style.display = 'none';
    loginContent.style.display = 'block';
});

// Close auth modal
document.querySelectorAll('.close-auth').forEach(btn => {
    btn.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
});

// Login handler
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            authModal.style.display = 'none';
            appContainer.style.display = 'block';
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Signup handler
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed up
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            return db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            authModal.style.display = 'none';
            appContainer.style.display = 'block';
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Logout handler
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        appContainer.style.display = 'none';
        authModal.style.display = 'flex';
        // Reset forms
        loginForm.reset();
        signupForm.reset();
        // Show login form
        signupContent.style.display = 'none';
        loginContent.style.display = 'block';
    });
});

// Auth state observer
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User logged in:", user);
        loadUserData(user.uid);
        loadPosts();
        loadStories();
        loadContacts();
    } else {
        console.log("No user logged in");
    }
});

// Load user data from Firestore
async function loadUserData(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            const userData = doc.data();
            console.log("User data:", userData);
            
            // Update UI with user data
            const profilePic = userData.profilePic || 'https://randomuser.me/api/portraits/men/32.jpg';
            const userName = userData.name || 'User';
            
            document.getElementById('profilePic').src = profilePic;
            document.getElementById('profileName').textContent = userName;
            document.getElementById('sidebarProfilePic').src = profilePic;
            document.getElementById('sidebarProfileName').textContent = userName;
            document.getElementById('postUserPic').src = profilePic;
            document.getElementById('storyUserPic').src = profilePic;
            document.getElementById('postInput').placeholder = `What's on your mind, ${userName}?`;
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

// Load posts from Firestore
async function loadPosts() {
    try {
        const querySnapshot = await db.collection('posts')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        postsContainer.innerHTML = ''; // Clear existing posts
        
        if (querySnapshot.empty) {
            postsContainer.innerHTML = '<div class="no-posts">No posts yet. Be the first to post!</div>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const post = doc.data();
            post.id = doc.id;
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error("Error loading posts:", error);
        postsContainer.innerHTML = '<div class="error">Error loading posts. Please try again.</div>';
    }
}

// Create post HTML element
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.dataset.id = post.id;
    
    const timeAgo = formatTimeAgo(post.timestamp?.toDate());
    
    postElement.innerHTML = `
        <div class="post-header">
            <img src="${post.userProfilePic || 'https://randomuser.me/api/portraits/men/32.jpg'}" alt="Profile">
            <div class="post-info">
                <span class="name">${post.userName}</span>
                <span class="time">${timeAgo} <i class="fas fa-globe-americas"></i></span>
            </div>
            <i class="fas fa-ellipsis-h"></i>
        </div>
        <div class="post-content">
            <p>${post.text || ''}</p>
            ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image">` : ''}
        </div>
        <div class="post-actions">
            <div class="action like-action ${post.likes?.includes(auth.currentUser?.uid) ? 'liked' : ''}">
                <i class="${post.likes?.includes(auth.currentUser?.uid) ? 'fas' : 'far'} fa-thumbs-up"></i>
                <span>${post.likes?.includes(auth.currentUser?.uid) ? 'Liked' : 'Like'}</span>
                ${post.likes?.length ? `<span class="like-count">${post.likes.length}</span>` : ''}
            </div>
            <div class="action">
                <i class="far fa-comment"></i>
                <span>Comment</span>
            </div>
            <div class="action">
                <i class="fas fa-share"></i>
                <span>Share</span>
            </div>
        </div>
    `;
    
    // Add like functionality
    const likeBtn = postElement.querySelector('.like-action');
    likeBtn.addEventListener('click', () => toggleLike(post.id, post.likes || []));
    
    return postElement;
}

// Toggle like on post
async function toggleLike(postId, currentLikes) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    try {
        const isLiked = currentLikes.includes(userId);
        let newLikes;
        
        if (isLiked) {
            newLikes = currentLikes.filter(id => id !== userId);
        } else {
            newLikes = [...currentLikes, userId];
        }
        
        await db.collection('posts').doc(postId).update({
            likes: newLikes
        });
        
        // Update UI
        loadPosts();
    } catch (error) {
        console.error("Error toggling like:", error);
    }
}

// Format time ago
function formatTimeAgo(date) {
    if (!date) return 'Just now';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    
    if (interval >= 1) {
        return interval + " year" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + " month" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + " day" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
    }
    return "Just now";
}

// Create new post
postInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && postInput.value.trim()) {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            // Check if there's an image to upload
            if (postImageInput.files[0]) {
                await uploadImageAndCreatePost(postInput.value, postImageInput.files[0]);
            } else {
                await createPost(postInput.value);
            }
            
            postInput.value = '';
            postImageInput.value = '';
            loadPosts(); // Refresh posts
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to create post. Please try again.");
        }
    }
});

// Handle image upload for post
photoVideoOption.addEventListener('click', () => {
    postImageInput.click();
});

postImageInput.addEventListener('change', () => {
    if (postImageInput.files[0]) {
        // You could show a preview of the image here
        console.log("Image selected:", postImageInput.files[0].name);
    }
});

// Upload image and create post
async function uploadImageAndCreatePost(text, imageFile) {
    const user = auth.currentUser;
    const storageRef = storage.ref(`posts/${user.uid}/${Date.now()}_${imageFile.name}`);
    const uploadTask = storageRef.put(imageFile);
    
    uploadTask.on('state_changed',
        (snapshot) => {
            // Progress monitoring could be added here
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
        },
        (error) => {
            console.error("Upload error:", error);
            throw error;
        },
        async () => {
            // Upload completed successfully
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            await createPost(text, downloadURL);
        }
    );
}

// Create post in Firestore
async function createPost(text, imageUrl = null) {
    const user = auth.currentUser;
    
    await db.collection('posts').add({
        text: text,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userProfilePic: user.photoURL || 'https://randomuser.me/api;