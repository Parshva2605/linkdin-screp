const API_URL = 'http://localhost:8000';

let currentProfileData = null;

// Check if we're on LinkedIn
async function checkLinkedInPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url && (tab.url.includes('linkedin.com/in/') || tab.url.includes('linkedin.com/profile/'))) {
    document.getElementById('status').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
    loadProfilePreview();
  } else {
    document.getElementById('status').classList.remove('hidden');
    document.getElementById('content').classList.add('hidden');
  }
}

// Load profile preview
async function loadProfilePreview() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    chrome.tabs.sendMessage(tab.id, { action: 'extractProfile' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready, injecting...');
        // Inject content script manually
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).then(() => {
          // Try again after injection
          setTimeout(() => loadProfilePreview(), 500);
        });
        return;
      }
      
      if (response && response.profile) {
        currentProfileData = response;
        console.log('Profile data received:', response);
        document.getElementById('profileName').textContent = response.profile.name || 'Unknown';
        document.getElementById('profileHeadline').textContent = response.profile.headline || 'No headline';
      } else {
        console.log('No profile data in response:', response);
      }
    });
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Analyze profile
async function analyzeProfile() {
  if (!currentProfileData) return;

  document.getElementById('analyzeBtn').style.display = 'none';
  document.getElementById('loading').classList.remove('hidden');

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentProfileData)
    });

    const result = await response.json();
    displayResults(result);
  } catch (error) {
    console.error('Analysis error:', error);
    // Show mock results if backend is not available
    displayMockResults();
  }
}

// Display results
function displayResults(data) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('results').classList.remove('hidden');

  // Animate score
  const score = data.score || 75;
  animateScore(score);

  // Display insights
  const insightsList = document.getElementById('insightsList');
  insightsList.innerHTML = '';

  (data.insights || []).forEach(insight => {
    const item = document.createElement('div');
    item.className = 'insight-item';
    item.innerHTML = `
      <div class="insight-icon ${insight.type}">
        ${insight.type === 'good' ? '✓' : insight.type === 'warning' ? '!' : 'i'}
      </div>
      <div>${insight.message}</div>
    `;
    insightsList.appendChild(item);
  });
}

// Mock results for demo
function displayMockResults() {
  const mockData = {
    score: 78,
    insights: [
      { type: 'good', message: 'Strong headline with clear value proposition' },
      { type: 'warning', message: 'About section could be more detailed (currently 45 words)' },
      { type: 'info', message: 'Add 3-5 more skills to improve discoverability' },
      { type: 'good', message: 'Recent experience shows career progression' },
      { type: 'warning', message: 'Consider adding media to showcase your work' }
    ]
  };
  displayResults(mockData);
}

// Animate score circle
function animateScore(targetScore) {
  const scoreValue = document.getElementById('scoreValue');
  const scoreCircle = document.getElementById('scoreCircle');
  const circumference = 339.292;
  const offset = circumference - (targetScore / 100) * circumference;

  let current = 0;
  const duration = 1000;
  const increment = targetScore / (duration / 16);

  const timer = setInterval(() => {
    current += increment;
    if (current >= targetScore) {
      current = targetScore;
      clearInterval(timer);
    }
    scoreValue.textContent = Math.round(current);
  }, 16);

  scoreCircle.style.strokeDashoffset = offset;
}

// Export data
function exportData() {
  if (!currentProfileData) {
    alert('No profile data to export. Please analyze a profile first.');
    return;
  }

  const dataStr = JSON.stringify(currentProfileData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `linkedin-profile-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  checkLinkedInPage();

  document.getElementById('analyzeBtn')?.addEventListener('click', analyzeProfile);
  document.getElementById('deepAnalyzeBtn')?.addEventListener('click', deepAnalyzeProfile);
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('detailedBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_URL}/report` });
  });
  document.getElementById('debugBtn')?.addEventListener('click', showDebugInfo);
});

// Deep analyze with complete data
async function deepAnalyzeProfile() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  document.getElementById('deepAnalyzeBtn').style.display = 'none';
  document.getElementById('analyzeBtn').style.display = 'none';
  document.getElementById('loading').classList.remove('hidden');
  
  chrome.tabs.sendMessage(tab.id, { action: 'deepScrape' }, async (response) => {
    if (chrome.runtime.lastError) {
      console.error('Deep scrape error:', chrome.runtime.lastError);
      displayMockResults();
      return;
    }
    
    if (response) {
      currentProfileData = response;
      console.log('Deep scraped data:', response);
      
      // Send to backend for analysis
      try {
        const apiResponse = await fetch(`${API_URL}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        
        const result = await apiResponse.json();
        displayResults(result);
      } catch (error) {
        console.error('API error:', error);
        displayMockResults();
      }
    }
  });
}

// Debug function
async function showDebugInfo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'extractProfile' }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Error: ' + chrome.runtime.lastError.message);
      return;
    }
    
    if (response) {
      alert('Profile Data:\n\n' + 
        'Name: ' + (response.profile.name || 'NOT FOUND') + '\n' +
        'Headline: ' + (response.profile.headline || 'NOT FOUND') + '\n' +
        'Location: ' + (response.profile.location || 'NOT FOUND') + '\n' +
        'About: ' + (response.profile.about ? response.profile.about.substring(0, 50) + '...' : 'NOT FOUND') + '\n' +
        'Experience: ' + (response.profile.experience?.length || 0) + ' items\n' +
        'Skills: ' + (response.profile.skills?.length || 0) + ' items\n' +
        'Education: ' + (response.profile.education?.length || 0) + ' items'
      );
      console.log('Full profile data:', response);
    } else {
      alert('No response from content script');
    }
  });
}
