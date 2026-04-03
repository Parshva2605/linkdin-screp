// My Profile Scraper - Extract logged-in user's own profile data

// Wait for element to appear in DOM
function waitForElement(selector, timeout = 15000) {
  return new Promise((resolve, reject) => {
    // Already in DOM?
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: "${selector}" not found`));
    }, timeout);
  });
}

// Scrape logged-in user's profile
async function scrapeMyProfile() {
  const data = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    isOwnProfile: true,
    profile: {
      name: '',
      headline: '',
      location: '',
      connections: '0',
      followers: '0',
      about: '',
      experience: [],
      education: [],
      skills: [],
      certifications: []
    }
  };

  console.log('Starting my profile scrape...');

  try {
    // Wait for main content - try multiple selectors for logged-in vs viewing others
    const mainSelector = await Promise.race([
      waitForElement('main section.artdeco-card', 3000).catch(() => null),
      waitForElement('.scaffold-layout__main', 3000).catch(() => null),
      waitForElement('main', 2000).catch(() => null)
    ]);

    if (!mainSelector) {
      throw new Error('Profile page not loaded. Please refresh and try again.');
    }

    // Wait a bit for content to render
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('=== DEBUG: Starting scrape ===');

    // NAME - try ALL possible selectors
    console.log('Looking for name...');
    const nameSelectors = [
      'h1',
      '.pv-text-details__left-panel h1',
      '[class*="profile"] h1',
      '.text-heading-xlarge',
      'main h1'
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText?.trim()) {
        name = el.innerText.trim();
        console.log(`✓ Name found with selector: ${selector}`, name);
        break;
      }
    }
    
    if (!name) {
      // Try getting ALL h1 elements and pick the first one with text
      const allH1 = document.querySelectorAll('h1');
      console.log('Found h1 elements:', allH1.length);
      for (const h1 of allH1) {
        const text = h1.innerText?.trim();
        console.log('h1 text:', text);
        if (text && text.length > 2 && text.length < 100) {
          name = text;
          console.log('✓ Name found from h1 scan:', name);
          break;
        }
      }
    }
    
    data.profile.name = name || '';

    // HEADLINE - try ALL possible selectors
    console.log('Looking for headline...');
    const headlineSelectors = [
      'div.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      '[class*="headline"]',
      '.text-body-medium',
      'main .text-body-medium'
    ];
    
    let headline = '';
    for (const selector of headlineSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText?.trim() && el.innerText.trim() !== name) {
        headline = el.innerText.trim();
        console.log(`✓ Headline found with selector: ${selector}`, headline);
        break;
      }
    }
    
    data.profile.headline = headline || '';

    // LOCATION - try ALL possible selectors
    console.log('Looking for location...');
    const locationSelectors = [
      'span.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .pb2 span',
      '.text-body-small',
      'main .text-body-small'
    ];
    
    let location = '';
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      const text = el?.innerText?.trim();
      if (text && text.includes(',')) {
        location = text;
        console.log(`✓ Location found with selector: ${selector}`, location);
        break;
      }
    }
    
    data.profile.location = location || '';

    // Connections & Followers
    const bodyText = document.body.textContent;
    const connMatch = bodyText.match(/(\d+[\+,]*)\s*connections?/i);
    const follMatch = bodyText.match(/(\d+[\+,]*)\s*followers?/i);
    data.profile.connections = connMatch ? connMatch[1] : '0';
    data.profile.followers = follMatch ? follMatch[1] : '0';

    // === ABOUT SECTION ===
    console.log('Looking for about section...');
    await waitForElement('#about', 3000).catch(() => {
      console.log('About section ID not found');
      return null;
    });
    
    const aboutSelectors = [
      '#about ~ div .visually-hidden',
      '#about ~ div span[aria-hidden="true"]',
      '.pv-about__summary-text',
      '.inline-show-more-text',
      '[id*="about"] ~ div span'
    ];
    
    let about = '';
    for (const selector of aboutSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText?.trim() && el.innerText.trim().length > 20) {
        about = el.innerText.trim();
        console.log(`✓ About found with selector: ${selector}`, about.substring(0, 50) + '...');
        break;
      }
    }
    
    // If still not found, try finding section by text
    if (!about) {
      const sections = document.querySelectorAll('section');
      for (const section of sections) {
        if (section.textContent.includes('About')) {
          const spans = section.querySelectorAll('span');
          for (const span of spans) {
            const text = span.innerText?.trim();
            if (text && text.length > 50 && !text.includes('About')) {
              about = text;
              console.log('✓ About found by scanning sections:', about.substring(0, 50) + '...');
              break;
            }
          }
          if (about) break;
        }
      }
    }
    
    data.profile.about = about || '';
    console.log('About result:', about ? 'Found' : 'Not found');

    // === EXPERIENCE ===
    await waitForElement('#experience', 3000).catch(() => null);
    
    // Try new selector first
    let experienceElements = document.querySelectorAll('#experience ~ .pvs-list__container .pvs-list__item--line-separated');
    
    // Fallback to old selector
    if (experienceElements.length === 0) {
      const expSection = document.getElementById('experience')?.closest('section');
      experienceElements = expSection?.querySelectorAll('.pvs-list__container > li') || [];
    }
    
    const experience = [...experienceElements]
      .map(el => el.querySelector('span[aria-hidden="true"]')?.innerText?.trim() || el.innerText?.trim())
      .filter(text => {
        // Filter out activity feed junk
        return text && 
               !text.includes('liked this') && 
               !text.includes('reposted') && 
               !text.includes('shared this') &&
               !text.includes('Report this') &&
               text.length > 10;
      });
    
    data.profile.experience = experience.map(exp => {
      const lines = exp.split('\n').filter(l => l.trim());
      return {
        title: lines[0] || '',
        company: lines[1] || '',
        duration: lines.find(l => /\d+\s*(yr|mo)/i.test(l)) || '',
        description: lines.slice(2).join(' ').substring(0, 500)
      };
    });

    console.log('Experience scraped:', data.profile.experience.length, 'items');

    // === EDUCATION ===
    await waitForElement('#education', 3000).catch(() => null);
    
    // Try new selector first
    let educationElements = document.querySelectorAll('#education ~ .pvs-list__container .pvs-list__item--line-separated');
    
    // Fallback to old selector
    if (educationElements.length === 0) {
      const eduSection = document.getElementById('education')?.closest('section');
      educationElements = eduSection?.querySelectorAll('.pvs-list__container > li') || [];
    }
    
    const education = [...educationElements]
      .map(el => el.querySelector('span[aria-hidden="true"]')?.innerText?.trim() || el.innerText?.trim())
      .filter(text => {
        // Filter out junk
        return text && 
               !text.includes('Report this') &&
               !text.includes('Copy') &&
               !text.includes('LinkedIn') &&
               !text.includes('Facebook') &&
               text.length > 5;
      });
    
    data.profile.education = education.map(edu => {
      const lines = edu.split('\n').filter(l => l.trim());
      const yearMatch = edu.match(/\d{4}\s*[-–]\s*\d{4}|\d{4}/);
      return {
        school: lines[0] || '',
        degree: lines[1] || '',
        duration: yearMatch ? yearMatch[0] : ''
      };
    });

    console.log('Education scraped:', data.profile.education.length, 'items');

    // === SKILLS ===
    await waitForElement('#skills', 3000).catch(() => null);
    
    // Try new selector first
    let skillElements = document.querySelectorAll('#skills ~ .pvs-list__container .pvs-list__item--line-separated');
    
    // Fallback to old selector
    if (skillElements.length === 0) {
      const skillSection = document.getElementById('skills')?.closest('section');
      skillElements = skillSection?.querySelectorAll('.pvs-list__container > li') || [];
    }
    
    const skills = [...skillElements]
      .map(el => el.querySelector('span[aria-hidden="true"]')?.innerText?.trim() || el.innerText?.trim())
      .filter(text => text && text.length > 2 && text.length < 100);
    
    data.profile.skills = skills.map(skill => {
      const skillName = skill.split('\n')[0]?.trim() || skill;
      const endorsementMatch = skill.match(/(\d+)\s*endorsement/i);
      return {
        name: skillName,
        endorsements: endorsementMatch ? parseInt(endorsementMatch[1]) : 0
      };
    });

    console.log('Skills scraped:', data.profile.skills.length, 'items');

    // === CERTIFICATIONS ===
    const certSection = Array.from(document.querySelectorAll('section')).find(s => 
      s.textContent.includes('Licenses & certifications')
    );
    if (certSection) {
      const certItems = [...certSection.querySelectorAll('.pvs-list__container .pvs-list__item--line-separated')];
      data.profile.certifications = certItems.map(item => {
        const text = item.querySelector('span[aria-hidden="true"]')?.innerText?.trim() || '';
        const lines = text.split('\n').filter(l => l.trim());
        return {
          name: lines[0] || '',
          issuer: lines[1] || ''
        };
      }).filter(cert => cert.name);
    }

    console.log('My profile scrape complete!', data);
    return data;

  } catch (error) {
    console.error('My profile scrape error:', error);
    data.error = error.message || 'Unknown error occurred';
    return data;
  }
}



// Export function
window.scrapeMyProfile = scrapeMyProfile;

// Debug function - run this in console to see what's on the page
window.debugLinkedInDOM = function() {
  console.log('=== LinkedIn DOM Debug ===');
  
  console.log('\n--- H1 Elements ---');
  const h1s = document.querySelectorAll('h1');
  h1s.forEach((h1, i) => {
    console.log(`H1 #${i}:`, h1.innerText?.trim().substring(0, 100));
    console.log('Classes:', h1.className);
  });
  
  console.log('\n--- Sections with IDs ---');
  const sections = document.querySelectorAll('section[id], div[id*="about"], div[id*="experience"], div[id*="education"], div[id*="skill"]');
  sections.forEach(section => {
    console.log(`ID: ${section.id}`, section.className);
  });
  
  console.log('\n--- Main Container ---');
  const main = document.querySelector('main');
  if (main) {
    console.log('Main found, classes:', main.className);
    console.log('First 5 children:');
    Array.from(main.children).slice(0, 5).forEach((child, i) => {
      console.log(`  Child ${i}:`, child.tagName, child.className);
    });
  }
  
  console.log('\n--- Text Body Medium Elements (first 5) ---');
  const textMedium = document.querySelectorAll('.text-body-medium');
  Array.from(textMedium).slice(0, 5).forEach((el, i) => {
    console.log(`#${i}:`, el.innerText?.trim().substring(0, 100));
  });
  
  console.log('\n=== End Debug ===');
};

console.log('💡 Run window.debugLinkedInDOM() in console to inspect the page structure');
