// Extract LinkedIn profile data from the page
function extractProfileData() {
  const data = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    profile: {},
    posts: [],
    activity: {},
    engagement: {}
  };

  try {
    // Get all h1 elements and find the name
    const allH1 = document.querySelectorAll('h1');
    for (const h1 of allH1) {
      const text = h1.textContent.trim();
      if (text && text.length > 2 && text.length < 100) {
        data.profile.name = text;
        break;
      }
    }

    // Get all text content from main area
    const mainContent = document.querySelector('main') || document.body;
    
    // Find headline - usually the first div after name
    const textDivs = mainContent.querySelectorAll('div[class*="text"]');
    for (const div of textDivs) {
      const text = div.textContent.trim();
      if (text && text !== data.profile.name && text.length > 10 && text.length < 200 && !text.includes('\n')) {
        data.profile.headline = text;
        break;
      }
    }

    // Location - look for location indicators
    const allSpans = mainContent.querySelectorAll('span');
    for (const span of allSpans) {
      const text = span.textContent.trim();
      if (text.includes(',') && text.length < 100 && (text.includes('India') || text.includes('USA') || text.includes('UK') || /\w+,\s*\w+/.test(text))) {
        data.profile.location = text;
        break;
      }
    }

    // Connections count
    const connectionText = document.body.textContent;
    const connectionMatch = connectionText.match(/(\d+[\+]?)\s*connections?/i);
    if (connectionMatch) {
      data.profile.connections = connectionMatch[1];
    }

    // Followers count
    const followerMatch = connectionText.match(/(\d+[\+]?)\s*followers?/i);
    if (followerMatch) {
      data.profile.followers = followerMatch[1];
    }

    // About section - look for section with id or aria-label
    const aboutSection = document.querySelector('[id*="about"]') || 
                         document.querySelector('[aria-label*="About"]') ||
                         Array.from(document.querySelectorAll('section')).find(s => s.textContent.includes('About'));
    
    if (aboutSection) {
      const aboutText = aboutSection.querySelector('span[aria-hidden="true"]')?.textContent ||
                       aboutSection.querySelector('.inline-show-more-text')?.textContent ||
                       aboutSection.textContent;
      if (aboutText && aboutText.length > 50) {
        data.profile.about = aboutText.trim().substring(0, 1000);
        
        // Analyze about section
        data.profile.aboutAnalysis = {
          wordCount: aboutText.trim().split(/\s+/).length,
          hasNumbers: /\d+/.test(aboutText),
          hasPercentages: /%/.test(aboutText),
          hasActionVerbs: /\b(built|created|led|managed|developed|designed|implemented|launched|achieved|increased|improved|delivered|established)\b/i.test(aboutText),
          hasPowerWords: /\b(expert|specialist|lead|senior|manager|director|architect|engineer|developer|designer|consultant)\b/i.test(aboutText)
        };
      }
    }

    // Experience - find all list items that look like experience
    data.profile.experience = [];
    const experienceSection = document.querySelector('[id*="experience"]') ||
                             Array.from(document.querySelectorAll('section')).find(s => 
                               s.textContent.includes('Experience')
                             );
    
    if (experienceSection) {
      const expItems = experienceSection.querySelectorAll('li');
      expItems.forEach(item => {
        const text = item.textContent;
        const lines = text.split('\n').filter(l => l.trim());
        
        if (lines.length >= 2) {
          const title = lines[0]?.trim() || '';
          const company = lines[1]?.trim() || '';
          const duration = lines.find(l => l.includes('yr') || l.includes('mo') || l.includes('·'))?.trim() || '';
          
          // Extract description/achievements
          const description = lines.slice(2).join(' ').trim();
          
          // Analyze each experience
          const expAnalysis = {
            title,
            company,
            duration,
            description: description.substring(0, 500),
            hasQuantifiableResults: /\d+%|\$\d+|increased|decreased|improved|reduced|grew/i.test(description),
            hasActionVerbs: /\b(built|created|led|managed|developed|designed|implemented|launched|achieved)\b/i.test(description),
            descriptionLength: description.length,
            bulletPoints: (description.match(/•|·|-/g) || []).length
          };
          
          data.profile.experience.push(expAnalysis);
        }
      });
    }

    // Skills
    data.profile.skills = [];
    const skillsSection = document.querySelector('[id*="skill"]') ||
                         Array.from(document.querySelectorAll('section')).find(s => 
                           s.textContent.includes('Skills') || s.textContent.includes('Skill')
                         );
    
    if (skillsSection) {
      const skillItems = skillsSection.querySelectorAll('li');
      skillItems.forEach(item => {
        const skillText = item.textContent.split('\n')[0]?.trim();
        const endorsements = item.textContent.match(/(\d+)\s*endorsement/i);
        
        if (skillText && skillText.length < 50 && skillText.length > 2) {
          data.profile.skills.push({
            name: skillText,
            endorsements: endorsements ? parseInt(endorsements[1]) : 0
          });
        }
      });
    }

    // Education
    data.profile.education = [];
    const eduSection = document.querySelector('[id*="education"]') ||
                      Array.from(document.querySelectorAll('section')).find(s => 
                        s.textContent.includes('Education')
                      );
    
    if (eduSection) {
      const eduItems = eduSection.querySelectorAll('li');
      eduItems.forEach(item => {
        const lines = item.textContent.split('\n').filter(l => l.trim());
        if (lines.length >= 1) {
          data.profile.education.push({
            school: lines[0]?.trim() || '',
            degree: lines[1]?.trim() || '',
            duration: lines.find(l => l.match(/\d{4}/))?.trim() || ''
          });
        }
      });
    }

    // Certifications
    data.profile.certifications = [];
    const certSection = document.querySelector('[id*="licenses"]') || document.querySelector('[id*="certification"]') ||
                       Array.from(document.querySelectorAll('section')).find(s => 
                         s.textContent.includes('Licenses & certifications') || s.textContent.includes('Certifications')
                       );
    
    if (certSection) {
      const certItems = certSection.querySelectorAll('li');
      certItems.forEach(item => {
        const lines = item.textContent.split('\n').filter(l => l.trim());
        if (lines.length >= 1) {
          data.profile.certifications.push({
            name: lines[0]?.trim() || '',
            issuer: lines[1]?.trim() || ''
          });
        }
      });
    }

    // Posts/Activity Analysis
    const activitySection = document.querySelector('[id*="activity"]') ||
                           Array.from(document.querySelectorAll('section')).find(s => 
                             s.textContent.includes('Activity') || s.textContent.includes('Posts')
                           );
    
    if (activitySection) {
      const postElements = activitySection.querySelectorAll('li, article, [class*="feed-shared"]');
      
      postElements.forEach((post, index) => {
        if (index < 10) { // Analyze first 10 posts
          const postText = post.textContent;
          
          // Extract engagement metrics
          const likes = postText.match(/(\d+)\s*reactions?/i);
          const comments = postText.match(/(\d+)\s*comments?/i);
          const shares = postText.match(/(\d+)\s*reposts?/i);
          
          // Extract post content
          const contentLines = postText.split('\n').filter(l => l.trim() && l.length > 20);
          const content = contentLines[0]?.substring(0, 200) || '';
          
          if (content) {
            data.posts.push({
              content: content,
              likes: likes ? parseInt(likes[1]) : 0,
              comments: comments ? parseInt(comments[1]) : 0,
              shares: shares ? parseInt(shares[1]) : 0,
              hasHashtags: /#\w+/.test(postText),
              hasMedia: /photo|video|document/i.test(postText),
              wordCount: content.split(/\s+/).length
            });
          }
        }
      });
      
      // Calculate engagement metrics
      if (data.posts.length > 0) {
        const totalLikes = data.posts.reduce((sum, p) => sum + p.likes, 0);
        const totalComments = data.posts.reduce((sum, p) => sum + p.comments, 0);
        const totalShares = data.posts.reduce((sum, p) => sum + p.shares, 0);
        
        data.activity = {
          totalPosts: data.posts.length,
          avgLikes: Math.round(totalLikes / data.posts.length),
          avgComments: Math.round(totalComments / data.posts.length),
          avgShares: Math.round(totalShares / data.posts.length),
          postsWithHashtags: data.posts.filter(p => p.hasHashtags).length,
          postsWithMedia: data.posts.filter(p => p.hasMedia).length
        };
      }
    }

    // Recommendations/Endorsements
    const recSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Recommendations')
    );
    
    if (recSection) {
      const recCount = recSection.textContent.match(/(\d+)\s*recommendations?/i);
      data.profile.recommendationsCount = recCount ? parseInt(recCount[1]) : 0;
    }

    console.log('Extracted comprehensive profile data:', data);

  } catch (error) {
    console.error('Error extracting profile data:', error);
    data.error = error.message;
  }

  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProfile') {
    const profileData = extractProfileData();
    sendResponse(profileData);
    return true;
  } 
  
  if (request.action === 'deepScrape') {
    // Use the deep scraper
    if (typeof deepScrapeProfile === 'function') {
      deepScrapeProfile().then(data => {
        sendResponse(data);
      }).catch(err => {
        sendResponse({ error: err.message });
      });
    } else {
      sendResponse({ error: 'Deep scraper not loaded' });
    }
    return true; // Keep channel open for async response
  } 
  
  if (request.action === 'smartScrape') {
    // Use the smart scraper (properly separates content types)
    if (typeof smartScrapeProfile === 'function') {
      smartScrapeProfile().then(data => {
        sendResponse(data);
      }).catch(err => {
        sendResponse({ error: err.message });
      });
    } else {
      sendResponse({ error: 'Smart scraper not loaded' });
    }
    return true;
  } 
  
  if (request.action === 'scrapeMyProfile') {
    // Use my profile scraper with DOM waiting
    if (typeof scrapeMyProfile === 'function') {
      scrapeMyProfile().then(data => {
        sendResponse(data);
      }).catch(err => {
        sendResponse({ error: err.message });
      });
    } else {
      // Function not loaded yet, try to call it after a delay
      setTimeout(() => {
        if (typeof scrapeMyProfile === 'function') {
          scrapeMyProfile().then(data => {
            sendResponse(data);
          }).catch(err => {
            sendResponse({ error: err.message });
          });
        } else {
          sendResponse({ error: 'My profile scraper not loaded. Please refresh the page and try again.' });
        }
      }, 1000);
    }
    return true;
  }
  
  return true;
});
