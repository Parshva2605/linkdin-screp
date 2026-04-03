// Background service worker for the extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Profile Analyzer installed');
});

// Listen for tab updates to detect LinkedIn pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com')) {
    chrome.action.setBadgeText({ text: '✓', tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#0a66c2', tabId: tabId });
  }
});
