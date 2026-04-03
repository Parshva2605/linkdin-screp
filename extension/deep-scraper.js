// Deep LinkedIn Profile Scraper - Collects EVERYTHING

async function deepScrapeProfile() {
  const data = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    profile: {
      basic: {},
      about: {},
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      awards: [],
      languages: [],
      publications: [],
      patents: []
    },
    posts: [],
    activity: {
      articles: [],
      comments: [],
      reactions: []
    },
    analytics: {},
    recommendations: []
  };

  console.log('Starting deep scrape...');

  try {
    // === BASIC PROFILE INFO ===
    data.profile.basic.name = document.querySelector('h1')?.textContent.trim() || '';
    data.profile.basic.headline = Array.from(document.querySelectorAll('div')).find(d => 
      d.textContent.length > 20 && d.textContent.length < 200 && !d.textContent.includes('\n')
    )?.textContent.trim() || '';
    
    // Profile photo URL
    const profileImg = document.querySelector('img[class*="profile"]') || document.querySelector('img[alt*="' + data.profile.basic.name + '"]');
    data.profile.basic.photoUrl = profileImg?.src || '';
    
    // Background image
    const bgImg = document.querySelector('img[class*="background"]');
    data.profile.basic.backgroundUrl = bgImg?.src || '';
    
    // Location
    const locationSpan = Array.from(document.querySelectorAll('span')).find(s => 
      /\w+,\s*\w+/.test(s.textContent) && s.textContent.length < 100
    );
    data.profile.basic.location = locationSpan?.textContent.trim() || '';
    
    // Contact info button
    const contactBtn = Array.from(document.querySelectorAll('a, button')).find(el => 
      el.textContent.includes('Contact info')
    );
    data.profile.basic.hasContactInfo = !!contactBtn;
    
    // Connections and followers
    const bodyText = document.body.textContent;
    const connMatch = bodyText.match(/(\d+[\+,]*)\s*connections?/i);
    const follMatch = bodyText.match(/(\d+[\+,]*)\s*followers?/i);
    data.profile.basic.connections = connMatch ? connMatch[1] : '0';
    data.profile.basic.followers = follMatch ? follMatch[1] : '0';

    // === ABOUT SECTION - COMPLETE ===
    const aboutSection = document.querySelector('[id*="about"]')?.closest('section');
    if (aboutSection) {
      const aboutText = aboutSection.textContent.replace(/About\s*/i, '').trim();
      data.profile.about = {
        fullText: aboutText,
        wordCount: aboutText.split(/\s+/).length,
        characterCount: aboutText.length,
        paragraphs: aboutText.split('\n\n').length,
        hasEmojis: /[\u{1F300}-\u{1F9FF}]/u.test(aboutText),
        hasLinks: /http|www\./i.test(aboutText),
        hasEmail: /\S+@\S+\.\S+/.test(aboutText),
        keywords: extractKeywords(aboutText),
        sentiment: analyzeSentiment(aboutText)
      };
    }

    // === EXPERIENCE - EVERY DETAIL ===
    const expSection = document.querySelector('[id*="experience"]')?.closest('section');
    if (expSection) {
      const expItems = expSection.querySelectorAll('li[class*="list"]');
      
      expItems.forEach((item, index) => {
        const allText = item.textContent;
        const lines = allText.split('\n').map(l => l.trim()).filter(l => l);
        
        const experience = {
          position: index + 1,
          title: lines[0] || '',
          company: lines[1] || '',
          employmentType: lines.find(l => /full-time|part-time|contract|freelance/i.test(l)) || '',
          duration: lines.find(l => /\d+\s*(yr|mo|year|month)/i.test(l)) || '',
          location: lines.find(l => /\w+,\s*\w+/.test(l) && l !== data.profile.basic.location) || '',
          description: '',
          achievements: [],
          skills: [],
          media: []
        };
        
        // Extract full description
        const descStart = lines.findIndex(l => l.length > 50);
        if (descStart > 0) {
          experience.description = lines.slice(descStart).join(' ');
        }
        
        // Extract achievements (lines with numbers, percentages, or action verbs)
        lines.forEach(line => {
          if (/\d+%|increased|decreased|improved|reduced|grew|built|led|managed|achieved/i.test(line) && line.length > 20) {
            experience.achievements.push(line);
          }
        });
        
        // Extract skills mentioned
        const skillKeywords = ['python', 'javascript', 'react', 'node', 'aws', 'docker', 'kubernetes', 'sql', 'java', 'c++'];
        skillKeywords.forEach(skill => {
          if (new RegExp(skill, 'i').test(allText)) {
            experience.skills.push(skill);
          }
        });
        
        // Check for media attachments
        const mediaElements = item.querySelectorAll('img, video, a[href*="document"]');
        experience.media = Array.from(mediaElements).map(m => ({
          type: m.tagName.toLowerCase(),
          url: m.src || m.href || ''
        }));
        
        data.profile.experience.push(experience);
      });
    }

    // === EDUCATION - COMPLETE ===
    const eduSection = document.querySelector('[id*="education"]')?.closest('section');
    if (eduSection) {
      const eduItems = eduSection.querySelectorAll('li');
      
      eduItems.forEach(item => {
        const lines = item.textContent.split('\n').map(l => l.trim()).filter(l => l);
        
        data.profile.education.push({
          school: lines[0] || '',
          degree: lines[1] || '',
          fieldOfStudy: lines[2] || '',
          grade: lines.find(l => /gpa|grade|cgpa/i.test(l)) || '',
          duration: lines.find(l => /\d{4}/.test(l)) || '',
          activities: lines.filter(l => l.length > 30).join('; '),
          description: item.textContent
        });
      });
    }

    // === SKILLS - WITH ENDORSEMENTS ===
    const skillsSection = document.querySelector('[id*="skill"]')?.closest('section');
    if (skillsSection) {
      const skillItems = skillsSection.querySelectorAll('li');
      
      skillItems.forEach(item => {
        const text = item.textContent;
        const skillName = text.split('\n')[0]?.trim();
        const endorsementMatch = text.match(/(\d+)\s*endorsement/i);
        
        if (skillName && skillName.length < 50) {
          data.profile.skills.push({
            name: skillName,
            endorsements: endorsementMatch ? parseInt(endorsementMatch[1]) : 0,
            isTopSkill: text.includes('Top skill') || item.querySelector('[class*="top"]') !== null
          });
        }
      });
    }

    // === CERTIFICATIONS ===
    const certSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Licenses & certifications') || s.textContent.includes('Certifications')
    );
    
    if (certSection) {
      const certItems = certSection.querySelectorAll('li');
      
      certItems.forEach(item => {
        const lines = item.textContent.split('\n').map(l => l.trim()).filter(l => l);
        
        data.profile.certifications.push({
          name: lines[0] || '',
          issuer: lines[1] || '',
          issueDate: lines.find(l => /issued|\d{4}/i.test(l)) || '',
          expiryDate: lines.find(l => /expir/i.test(l)) || '',
          credentialId: lines.find(l => /credential|id/i.test(l)) || '',
          credentialUrl: item.querySelector('a')?.href || ''
        });
      });
    }

    // === PROJECTS ===
    const projectSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Projects')
    );
    
    if (projectSection) {
      const projectItems = projectSection.querySelectorAll('li');
      
      projectItems.forEach(item => {
        const lines = item.textContent.split('\n').map(l => l.trim()).filter(l => l);
        
        data.profile.projects.push({
          name: lines[0] || '',
          description: lines.slice(1).join(' '),
          url: item.querySelector('a')?.href || '',
          duration: lines.find(l => /\d{4}/.test(l)) || ''
        });
      });
    }

    // === AWARDS & HONORS ===
    const awardSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Honors & awards') || s.textContent.includes('Awards')
    );
    
    if (awardSection) {
      const awardItems = awardSection.querySelectorAll('li');
      
      awardItems.forEach(item => {
        const lines = item.textContent.split('\n').map(l => l.trim()).filter(l => l);
        
        data.profile.awards.push({
          title: lines[0] || '',
          issuer: lines[1] || '',
          date: lines.find(l => /\d{4}/.test(l)) || '',
          description: lines.slice(2).join(' ')
        });
      });
    }

    // === LANGUAGES ===
    const langSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Languages')
    );
    
    if (langSection) {
      const langItems = langSection.querySelectorAll('li');
      
      langItems.forEach(item => {
        const text = item.textContent;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        
        data.profile.languages.push({
          name: lines[0] || '',
          proficiency: lines.find(l => /native|fluent|professional|elementary/i.test(l)) || ''
        });
      });
    }

    // === POSTS - COMPLETE ANALYSIS ===
    console.log('Scraping posts...');
    const activitySection = document.querySelector('[id*="activity"]')?.closest('section');
    
    if (activitySection) {
      const postElements = activitySection.querySelectorAll('li, article, [class*="feed"]');
      
      postElements.forEach((post, index) => {
        if (index < 20) { // Get first 20 posts
          const postText = post.textContent;
          const postHtml = post.innerHTML;
          
          // Extract post content
          const contentLines = postText.split('\n').filter(l => l.trim() && l.length > 10);
          const mainContent = contentLines.slice(0, 10).join('\n');
          
          // Extract metrics
          const likesMatch = postText.match(/(\d+[\,]*)\s*reactions?/i);
          const commentsMatch = postText.match(/(\d+[\,]*)\s*comments?/i);
          const sharesMatch = postText.match(/(\d+[\,]*)\s*reposts?/i);
          
          // Extract hashtags
          const hashtags = (mainContent.match(/#\w+/g) || []);
          
          // Extract mentions
          const mentions = (mainContent.match(/@[\w\s]+/g) || []);
          
          // Check post type
          const hasImage = /photo|image/i.test(postText) || post.querySelector('img') !== null;
          const hasVideo = /video/i.test(postText) || post.querySelector('video') !== null;
          const hasDocument = /document|pdf/i.test(postText);
          const hasLink = post.querySelector('a[href*="http"]') !== null;
          
          // Extract timestamp
          const timeMatch = postText.match(/(\d+)\s*(min|hour|day|week|month|yr)/i);
          
          const postData = {
            index: index + 1,
            content: mainContent.substring(0, 1000),
            fullText: postText,
            wordCount: mainContent.split(/\s+/).length,
            characterCount: mainContent.length,
            likes: likesMatch ? parseInt(likesMatch[1].replace(',', '')) : 0,
            comments: commentsMatch ? parseInt(commentsMatch[1].replace(',', '')) : 0,
            shares: sharesMatch ? parseInt(sharesMatch[1].replace(',', '')) : 0,
            hashtags: hashtags,
            hashtagCount: hashtags.length,
            mentions: mentions,
            mentionCount: mentions.length,
            hasMedia: hasImage || hasVideo || hasDocument,
            mediaType: hasImage ? 'image' : hasVideo ? 'video' : hasDocument ? 'document' : 'text',
            hasLink: hasLink,
            timeAgo: timeMatch ? `${timeMatch[1]} ${timeMatch[2]}` : 'unknown',
            engagement: {
              total: (likesMatch ? parseInt(likesMatch[1].replace(',', '')) : 0) + 
                     (commentsMatch ? parseInt(commentsMatch[1].replace(',', '')) : 0) + 
                     (sharesMatch ? parseInt(sharesMatch[1].replace(',', '')) : 0),
              rate: 0
            },
            sentiment: analyzeSentiment(mainContent),
            keywords: extractKeywords(mainContent)
          };
          
          // Calculate engagement rate
          const totalReach = parseInt(data.profile.basic.connections.replace(/[+,]/g, '')) || 100;
          postData.engagement.rate = ((postData.engagement.total / totalReach) * 100).toFixed(2);
          
          data.posts.push(postData);
        }
      });
    }

    // === RECOMMENDATIONS ===
    const recSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Recommendations')
    );
    
    if (recSection) {
      const recItems = recSection.querySelectorAll('li');
      
      recItems.forEach(item => {
        const text = item.textContent;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        
        data.recommendations.push({
          from: lines[0] || '',
          relationship: lines[1] || '',
          text: lines.slice(2).join(' '),
          date: lines.find(l => /\d{4}/.test(l)) || ''
        });
      });
    }

    // === ANALYTICS & SUMMARY ===
    data.analytics = {
      profileCompleteness: calculateCompleteness(data),
      totalSections: Object.keys(data.profile).filter(k => 
        Array.isArray(data.profile[k]) ? data.profile[k].length > 0 : Object.keys(data.profile[k]).length > 0
      ).length,
      totalPosts: data.posts.length,
      totalEngagement: data.posts.reduce((sum, p) => sum + p.engagement.total, 0),
      avgEngagementPerPost: data.posts.length > 0 ? 
        (data.posts.reduce((sum, p) => sum + p.engagement.total, 0) / data.posts.length).toFixed(2) : 0,
      topHashtags: getTopHashtags(data.posts),
      postingFrequency: analyzePostingFrequency(data.posts),
      contentTypes: {
        text: data.posts.filter(p => p.mediaType === 'text').length,
        image: data.posts.filter(p => p.mediaType === 'image').length,
        video: data.posts.filter(p => p.mediaType === 'video').length,
        document: data.posts.filter(p => p.mediaType === 'document').length
      }
    };

    console.log('Deep scrape complete!', data);
    return data;

  } catch (error) {
    console.error('Deep scrape error:', error);
    data.error = error.message;
    return data;
  }
}

// Helper functions
function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const frequency = {};
  words.forEach(word => {
    if (!['that', 'this', 'with', 'from', 'have', 'been', 'were', 'will'].includes(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function analyzeSentiment(text) {
  const positive = ['great', 'excellent', 'amazing', 'successful', 'achieved', 'improved', 'increased', 'best', 'love', 'excited'];
  const negative = ['failed', 'difficult', 'challenge', 'problem', 'issue', 'decreased', 'reduced'];
  
  const lowerText = text.toLowerCase();
  const posCount = positive.filter(word => lowerText.includes(word)).length;
  const negCount = negative.filter(word => lowerText.includes(word)).length;
  
  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

function calculateCompleteness(data) {
  let score = 0;
  if (data.profile.basic.name) score += 10;
  if (data.profile.basic.headline) score += 10;
  if (data.profile.basic.photoUrl) score += 10;
  if (data.profile.about.fullText) score += 15;
  if (data.profile.experience.length > 0) score += 15;
  if (data.profile.education.length > 0) score += 10;
  if (data.profile.skills.length >= 5) score += 10;
  if (data.profile.certifications.length > 0) score += 10;
  if (data.posts.length > 0) score += 10;
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
    .slice(0, 10);
}

function analyzePostingFrequency(posts) {
  const recent = posts.filter(p => 
    p.timeAgo.includes('day') || p.timeAgo.includes('hour') || p.timeAgo.includes('min')
  ).length;
  
  if (recent >= 3) return 'Very Active (3+ posts this week)';
  if (recent >= 1) return 'Active (1-2 posts this week)';
  return 'Low Activity (less than 1 post per week)';
}

// Export function
window.deepScrapeProfile = deepScrapeProfile;
