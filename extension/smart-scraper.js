// Smart LinkedIn Scraper - Properly identifies and separates different content types

// Helper function to expand all collapsed sections
async function expandAllSections() {
  console.log('🔄 Expanding all sections...');
  
  // Wait for page to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find and click all "Show more" / "Show all" buttons
  const expandButtons = [
    // Activity/Posts section
    'button[aria-label*="Show all"]',
    'button[aria-label*="show all"]',
    'button:has-text("Show all activity")',
    'button:has-text("Show all posts")',
    'button:has-text("See all activity")',
    'button:has-text("See all posts")',
    
    // Experience section
    'button[aria-label*="Show all experiences"]',
    'button[aria-label*="Show all positions"]',
    
    // Education section
    'button[aria-label*="Show all education"]',
    
    // Skills section
    'button[aria-label*="Show all skills"]',
    
    // Generic show more buttons
    'button.artdeco-button--tertiary:has-text("Show more")',
    'button.artdeco-button--tertiary:has-text("See more")',
    'span:has-text("Show all")',
    'span:has-text("See all")'
  ];
  
  let clickedCount = 0;
  
  for (const selector of expandButtons) {
    try {
      // Try different methods to find buttons
      let buttons = [];
      
      // Method 1: Direct querySelector
      const directButtons = document.querySelectorAll(selector);
      buttons.push(...Array.from(directButtons));
      
      // Method 2: Find by text content
      if (selector.includes('has-text')) {
        const text = selector.match(/has-text\("([^"]+)"\)/)?.[1];
        if (text) {
          const allButtons = document.querySelectorAll('button, span, a');
          const textButtons = Array.from(allButtons).filter(btn => 
            btn.textContent.toLowerCase().includes(text.toLowerCase())
          );
          buttons.push(...textButtons);
        }
      }
      
      // Click all found buttons
      for (const button of buttons) {
        if (button && button.offsetParent !== null) { // Check if visible
          console.log(`  ✓ Clicking: ${button.textContent.trim().substring(0, 50)}`);
          button.click();
          clickedCount++;
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for content to load
        }
      }
    } catch (error) {
      // Silently continue if selector doesn't work
    }
  }
  
  console.log(`✅ Clicked ${clickedCount} expand buttons`);
  
  // Wait for all content to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Scroll to load lazy-loaded content
  console.log('📜 Scrolling to load content...');
  const scrollSteps = 5;
  const scrollDelay = 300;
  
  for (let i = 0; i < scrollSteps; i++) {
    window.scrollTo(0, (document.body.scrollHeight / scrollSteps) * (i + 1));
    await new Promise(resolve => setTimeout(resolve, scrollDelay));
  }
  
  // Scroll back to top
  window.scrollTo(0, 0);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('✅ All sections expanded and loaded');
}

async function smartScrapeProfile() {
  console.log('Starting smart scrape with auto-expansion...');
  
  // === STEP 1: AUTO-EXPAND ALL SECTIONS ===
  await expandAllSections();
  
  const data = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    profile: {
      basic: {},
      about: '',
      experience: [],
      education: [],
      skills: [],
      certifications: []
    },
    posts: [],
    analytics: {}
  };

  console.log('Starting data collection after expansion...');

  try {
    // === BASIC INFO ===
    data.profile.basic.name = document.querySelector('h1')?.textContent.trim() || '';
    
    // Get headline from top of profile (not from activity)
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const text = div.textContent.trim();
      if (text.length > 20 && text.length < 200 && 
          !text.includes('\n') && 
          !text.includes('Sign in') &&
          !text.includes('Report') &&
          !text.includes('liked this') &&
          !text.includes('reposted') &&
          text !== data.profile.basic.name) {
        data.profile.basic.headline = text;
        break;
      }
    }
    
    // Location
    const locationSpan = Array.from(document.querySelectorAll('span')).find(s => {
      const text = s.textContent.trim();
      return /^[\w\s]+,\s*[\w\s]+/.test(text) && text.length < 100 && text.length > 10;
    });
    data.profile.basic.location = locationSpan?.textContent.trim() || '';
    
    // Connections and followers
    const bodyText = document.body.textContent;
    const connMatch = bodyText.match(/(\d+[\+,]*)\s*connections?/i);
    const follMatch = bodyText.match(/(\d+[\+,]*)\s*followers?/i);
    data.profile.basic.connections = connMatch ? connMatch[1] : '0';
    data.profile.basic.followers = follMatch ? follMatch[1] : '0';

    // === ABOUT SECTION ===
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      const aboutParent = aboutSection.closest('section');
      const aboutTextEl = aboutParent?.querySelector('.inline-show-more-text') || 
                         aboutParent?.querySelector('span[aria-hidden="true"]');
      
      if (aboutTextEl) {
        const aboutText = aboutTextEl.textContent.trim();
        if (aboutText.length > 50 && !aboutText.includes('About')) {
          data.profile.about = aboutText;
        }
      }
    }

    // === EXPERIENCE - Only real work experience ===
    const experienceSection = document.getElementById('experience');
    if (experienceSection) {
      const expParent = experienceSection.closest('section');
      const expList = expParent?.querySelectorAll('li');
      
      if (expList) {
        expList.forEach(item => {
          const text = item.textContent;
          
          // SKIP if this is activity feed content
          if (text.includes('liked this') || 
              text.includes('reposted this') || 
              text.includes('shared this') ||
              text.includes('commented on') ||
              text.includes('Report this post')) {
            return; // This is a post, not experience
          }
          
          // SKIP if too short (UI elements)
          if (text.length < 50) return;
          
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);
          
          if (lines.length >= 2) {
            const title = lines[0] || '';
            const company = lines[1] || '';
            
            // Find duration
            const durationLine = lines.find(l => /\d+\s*(yr|mo|year|month)/i.test(l) || /\d{4}\s*[-–]/.test(l));
            const duration = durationLine || '';
            
            // Get description (longer text)
            const description = lines.find(l => l.length > 100) || '';
            
            // Only add if it looks like real experience
            if (title && title.length > 3 && title !== data.profile.basic.name) {
              data.profile.experience.push({
                title,
                company,
                duration,
                description: description.substring(0, 1000)
              });
            }
          }
        });
      }
    }

    // === EDUCATION ===
    const educationSection = document.getElementById('education');
    if (educationSection) {
      const eduParent = educationSection.closest('section');
      const eduList = eduParent?.querySelectorAll('li');
      
      if (eduList) {
        eduList.forEach(item => {
          const text = item.textContent;
          
          // Skip UI elements and activity
          if (text.includes('Report this') || 
              text.includes('Copy') || 
              text.includes('liked this') ||
              text.length < 20) {
            return;
          }
          
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);
          
          if (lines.length >= 1) {
            const school = lines[0] || '';
            const degree = lines[1] || '';
            const yearMatch = text.match(/\d{4}\s*[-–]\s*\d{4}|\d{4}/);
            
            if (school && school.length > 3 && !school.includes('LinkedIn')) {
              data.profile.education.push({
                school,
                degree,
                duration: yearMatch ? yearMatch[0] : ''
              });
            }
          }
        });
      }
    }

    // === SKILLS ===
    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
      const skillParent = skillsSection.closest('section');
      const skillList = skillParent?.querySelectorAll('li');
      
      if (skillList) {
        skillList.forEach(item => {
          const text = item.textContent.trim();
          const skillName = text.split('\n')[0]?.trim();
          const endorsementMatch = text.match(/(\d+)\s*endorsement/i);
          
          if (skillName && skillName.length > 2 && skillName.length < 50 && 
              !skillName.includes('Show all') && !skillName.includes('Skills')) {
            data.profile.skills.push({
              name: skillName,
              endorsements: endorsementMatch ? parseInt(endorsementMatch[1]) : 0
            });
          }
        });
      }
    }

    // === POSTS - Only from Activity section ===
    const activitySection = document.getElementById('activity');
    if (activitySection) {
      const activityParent = activitySection.closest('section');
      const activityList = activityParent?.querySelectorAll('li');
      
      if (activityList) {
        activityList.forEach((item, index) => {
          if (index >= 50) return; // Increased from 20 to 50 posts
          
          const postText = item.textContent;
          
          // Only process if it's clearly a post/activity
          if (!postText.includes('liked this') && 
              !postText.includes('reposted') && 
              !postText.includes('shared') &&
              !postText.includes('commented')) {
            return; // Not a post
          }
          
          // Determine post type
          let postType = 'original';
          if (postText.includes('liked this')) postType = 'liked';
          if (postText.includes('reposted this')) postType = 'reposted';
          if (postText.includes('shared this')) postType = 'shared';
          
          // Extract content
          const lines = postText.split('\n').filter(l => {
            const trimmed = l.trim();
            return trimmed.length > 20 && 
                   !trimmed.includes('Report this') &&
                   !trimmed.includes('Copy') &&
                   !trimmed.includes('LinkedIn');
          });
          
          const content = lines.slice(0, 5).join(' ').substring(0, 500);
          
          // Extract metrics
          const likesMatch = postText.match(/(\d+[\,]*)\s*reactions?/i);
          const commentsMatch = postText.match(/(\d+[\,]*)\s*comments?/i);
          const sharesMatch = postText.match(/(\d+[\,]*)\s*reposts?/i);
          
          // Extract hashtags
          const hashtags = (content.match(/#\w+/g) || []);
          
          // Time
          const timeMatch = postText.match(/(\d+)\s*(min|h|d|w|mo|yr)/i);
          
          if (content.length > 30) {
            data.posts.push({
              type: postType,
              content: content,
              likes: likesMatch ? parseInt(likesMatch[1].replace(',', '')) : 0,
              comments: commentsMatch ? parseInt(commentsMatch[1].replace(',', '')) : 0,
              shares: sharesMatch ? parseInt(sharesMatch[1].replace(',', '')) : 0,
              hashtags: hashtags,
              timeAgo: timeMatch ? `${timeMatch[1]}${timeMatch[2]}` : '',
              hasMedia: /photo|video|document/i.test(postText)
            });
          }
        });
      }
    }

    // === ANALYTICS ===
    data.analytics = {
      profileCompleteness: calculateCompleteness(data),
      totalExperience: data.profile.experience.length,
      totalEducation: data.profile.education.length,
      totalSkills: data.profile.skills.length,
      totalPosts: data.posts.length,
      avgEngagement: data.posts.length > 0 ? 
        (data.posts.reduce((sum, p) => sum + p.likes + p.comments, 0) / data.posts.length).toFixed(1) : 0
    };

    console.log('Smart scrape complete!', data);
    return data;

  } catch (error) {
    console.error('Smart scrape error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    data.error = error.message || 'Unknown error occurred';
    return data;
  }
}

function calculateCompleteness(data) {
  let score = 0;
  if (data.profile.basic.name) score += 10;
  if (data.profile.basic.headline) score += 10;
  if (data.profile.about && data.profile.about.length > 50) score += 20;
  if (data.profile.experience.length > 0) score += 20;
  if (data.profile.education.length > 0) score += 10;
  if (data.profile.skills.length >= 5) score += 15;
  if (data.profile.certifications.length > 0) score += 10;
  if (data.posts.length > 0) score += 5;
  return score;
}

function getTopHashtags(posts) {
  const allHashtags = posts.flatMap(p => p.hashtags);
  const frequency = {};
  allHashtags.forEach(tag => {
    frequency[tag] = (frequency[tag] || 0) + 1;
  });
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
}

window.smartScrapeProfile = smartScrapeProfile;
