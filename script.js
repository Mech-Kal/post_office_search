const ipDisplay = document.getElementById('ip-display');
const getStartedBtn = document.getElementById('get-started-btn');
const initialScreen = document.getElementById('initial-screen');
const infoScreen = document.getElementById('info-screen');
const postOfficeList = document.getElementById('post-office-list');
const searchInput = document.getElementById('search-input');

let currentIP = '';
let postOfficeData = [];

// --- STEP 1: Get User's IP Address ---
async function getClientIP() {
    try {
        // Using a common IP service. The GfG tutorial likely suggests a similar method.
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        currentIP = data.ip;
        ipDisplay.textContent = currentIP;
        getStartedBtn.disabled = false;
    } catch (error) {
        console.error('Error fetching IP address:', error);
        ipDisplay.textContent = 'Failed to load IP.';
    }
}

// --- STEP 2: Fetch User Information Using IP Address ---
async function fetchUserInfo(ip) {
    const apiURL = `https://ipapi.co/${ip}/json/`;
    try {
        const response = await fetch(apiURL);
        if (!response.ok) {
            throw new Error(`IP API fetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Hide initial and show info screen
        initialScreen.style.display = 'none';
        infoScreen.style.display = 'block';

        displayUserInfo(data);
        
        // Chain the next steps
        displayCurrentTime(data.timezone);
        await fetchPostOffices(data.postal);
        
        // --- STEP 3: Display User's Location on Google Map ---
        displayMap(data.latitude, data.longitude);

    } catch (error) {
        console.error('Error fetching user info:', error);
        alert('Could not retrieve detailed location information.');
    }
}

// Helper function to display basic info (from Step 2)
function displayUserInfo(data) {
    document.getElementById('ip-address-val').textContent = data.ip || 'N/A';
    document.getElementById('city-val').textContent = data.city || 'N/A';
    document.getElementById('org-val').textContent = data.org || 'N/A';
    document.getElementById('lat-val').textContent = data.latitude || 'N/A';
    document.getElementById('long-val').textContent = data.longitude || 'N/A';
    document.getElementById('region-val').textContent = data.region || 'N/A';
    document.getElementById('timezone-val').textContent = data.timezone || 'N/A';
    document.getElementById('pincode-val').textContent = data.postal || 'N/A';
}

// --- STEP 3 (Implementation): Display Map ---
function displayMap(lat, lon) {
    const mapContainer = document.getElementById('map-container');
    // Using the format from the StackOverflow post for an iframe map with marker
    const mapSrc = `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`;
    
    mapContainer.innerHTML = `
        <iframe 
            width="100%" 
            height="450" 
            frameborder="0" 
            style="border:0"
            src="${mapSrc}" 
            allowfullscreen>
        </iframe>
    `;
}

// --- STEP 4: Display Current Time in User's Timezone ---
function displayCurrentTime(timezone) {
    if (!timezone) {
        document.getElementById('datetime-val').textContent = 'N/A';
        return;
    }
    try {
        // Use Intl.DateTimeFormat for a specific timezone
        const options = { 
            timeZone: timezone, 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const dateAndTime = formatter.format(new Date());

        document.getElementById('timezone-val').textContent = timezone;
        document.getElementById('datetime-val').textContent = dateAndTime;
    } catch (e) {
        console.error("Error setting timezone:", e);
        document.getElementById('datetime-val').textContent = 'Error displaying time.';
    }
}

// --- STEP 5: Retrieve and Display Local Post Offices ---
async function fetchPostOffices(pincode) {
    if (!pincode) {
        document.getElementById('message-val').textContent = 'Pincode not available.';
        return;
    }
    const apiURL = `https://api.postalpincode.in/pincode/${pincode}`;
    try {
        const response = await fetch(apiURL);
        if (!response.ok) {
            throw new Error(`Post office API fetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        
        const status = data[0].Status;
        const message = data[0].Message;
        document.getElementById('message-val').textContent = message;

        if (status === 'Success') {
            postOfficeData = data[0].PostOffice;
            renderPostOffices(postOfficeData);
        } else {
            postOfficeList.innerHTML = '<p>No post offices found for this pincode.</p>';
        }
    } catch (error) {
        console.error('Error fetching post offices:', error);
        postOfficeList.innerHTML = '<p>Failed to load post office data.</p>';
    }
}

function createPostOfficeCard(po) {
    return `
        <div class="post-office-card">
            <p><strong>Name:</strong> ${po.Name}</p>
            <p><strong>Branch Type:</strong> ${po.BranchType}</p>
            <p><strong>Delivery Status:</strong> ${po.DeliveryStatus}</p>
            <p><strong>District:</strong> ${po.District}</p>
            <p><strong>Division:</strong> ${po.Division}</p>
        </div>
    `;
}

function renderPostOffices(data) {
    postOfficeList.innerHTML = data.map(createPostOfficeCard).join('');
}

// --- STEP 6: Add Search Functionality ---
searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    
    if (postOfficeData.length === 0) return;

    const filteredData = postOfficeData.filter(po => {
        // Check both Name and BranchType for the search term
        return po.Name.toLowerCase().includes(searchTerm) ||
               po.BranchType.toLowerCase().includes(searchTerm);
    });

    if (filteredData.length > 0) {
        renderPostOffices(filteredData);
    } else {
        postOfficeList.innerHTML = '<p>No post offices match your search criteria.</p>';
    }
});

// --- Event Listeners and Initial Call ---
getStartedBtn.addEventListener('click', () => {
    if (currentIP) {
        fetchUserInfo(currentIP);
    }
});

// Start by getting the client's IP address
getClientIP();