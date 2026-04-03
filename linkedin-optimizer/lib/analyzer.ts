const OLLAMA_API = 'http://localhost:11434/api/generate';
const MODEL = 'qwen3:8b';

export async function analyzeProfile(data: any) {
  console.log('🔍 Starting profile analysis...');
  console.log('📊 Profile data received:', {
    hasProfile: !!data.profile,
    hasPosts: !!data.posts,
    postsCount: data.posts?.length || 0
  });
  
  const systemPrompt = `You are an expert LinkedIn profile optimization consultant. Analyze profiles AND posts to provide SPECIFIC, ACTIONABLE insights.

CRITICAL RULES:
1. Be SPECIFIC - Quote actual data, give exact numbers
2. Analyze BOTH profile AND posts
3. Identify EXACT problems with examples
4. Give CONCRETE action items
5. Return ONLY valid JSON

OUTPUT FORMAT:
{
  "score": <0-100>,
  "scoreDescription": "<one sentence>",
  "dataQualityIssues": [{"type": "error", "title": "<issue>", "description": "<details>"}],
  "optimizations": [{"type": "warning", "title": "<suggestion>", "description": "<action>"}],
  "strengths": [{"type": "success", "title": "<strength>", "description": "<why>"}],
  "postAnalysis": [{"type": "info", "title": "<post insight>", "description": "<improvement>"}],
  "priorityActions": ["<action 1>", "<action 2>", "<action 3>"]
}`;

  const userPrompt = `Analyze this LinkedIn profile INCLUDING posts:

${JSON.stringify(data, null, 2)}

Check:
1. Data quality (junk data, UI elements)
2. Profile completeness
3. Content quality (metrics, keywords)
4. Post quality (hooks, structure, hashtags, CTAs)
5. Engagement potential

For posts, analyze:
- Content quality and storytelling
- Structure and formatting
- Hashtag usage
- Call-to-action
- Specific improvements with examples

Return ONLY JSON.`;

  try {
    console.log('🌐 Attempting to connect to Ollama...');
    
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: systemPrompt + "\n\n" + userPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 3000,
          top_p: 0.9,
          top_k: 40
        }
      }),
      signal: controller.signal
    }).catch((err) => {
      clearTimeout(timeoutId);
      console.log('❌ Ollama connection failed:', err.message);
      throw new Error('Ollama not available');
    });

    clearTimeout(timeoutId);
    console.log('✅ Ollama responded');

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const result = await response.json();
    const responseText = result.response;
    
    // Extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No JSON in response');
  } catch (error) {
    // Silently use fallback - no console error
    console.log('⚠️ Ollama not available, using fallback analysis');
    return generateFallbackInsights(data);
  }
}

function generateFallbackInsights(data: any) {
  console.log('🔄 Generating fallback insights...');
  const profile = data.profile || {};
  
  // Handle both data structures: profile.basic.name OR profile.name
  const basic = profile.basic || profile;
  const name = basic.name || profile.name || '';
  const location = basic.location || profile.location || '';
  const connections = basic.connections || profile.connections || '0';
  const followers = basic.followers || profile.followers || '0';
  
  const about = profile.about || '';
  const experience = profile.experience || [];
  const education = profile.education || [];
  const skills = profile.skills || [];
  const certifications = profile.certifications || [];
  const posts = data.posts || [];
  const analytics = data.analytics || {};
  
  const issues = [];
  const optimizations = [];
  const strengths = [];
  const postAnalysis = [];
  const actions = [];
  
  let score = 50;

  // Clean junk data from education (UI elements scraped by mistake)
  const junkKeywords = ['Report this', 'Copy', 'LinkedIn', 'Facebook', 'X', 'Posts', 'Comments', 'Reactions'];
  const cleanEducation = education.filter((edu: any) => {
    const schoolName = (edu.school || '').toLowerCase();
    return !junkKeywords.some(keyword => schoolName.includes(keyword.toLowerCase()));
  });

  // Profile basic info analysis
  if (!name || name.trim() === '') {
    issues.push({
      type: 'error',
      title: 'Missing Name',
      description: 'Profile name is empty. Add your full professional name.'
    });
    score -= 20;
  } else {
    strengths.push({
      type: 'success',
      title: 'Profile Name Present',
      description: `"${name}" is clear and professional. Good foundation for your profile.`
    });
    score += 5;
  }

  // Location check
  if (!location || location.trim() === '') {
    optimizations.push({
      type: 'warning',
      title: 'Missing Location',
      description: 'Add your location (city, country) to help recruiters find you and show up in local searches.'
    });
    actions.push('Add your location to improve discoverability');
    score -= 5;
  } else {
    strengths.push({
      type: 'success',
      title: 'Location Added',
      description: `Location helps with local job searches.`
    });
    score += 3;
  }

  // Connections analysis
  const connectionsNum = connections === '500+' ? 500 : parseInt(connections) || 0;
  if (connectionsNum < 100) {
    optimizations.push({
      type: 'warning',
      title: `Low Connection Count: ${connections}`,
      description: 'Target 500+ connections. Connect with colleagues, classmates, industry peers, and recruiters. Send 10 personalized connection requests daily.'
    });
    actions.push(`Grow network from ${connections} to 500+: connect with colleagues, alumni, and industry professionals`);
    score -= 10;
  } else if (connectionsNum < 500) {
    optimizations.push({
      type: 'warning',
      title: `${connections} Connections - Keep Growing`,
      description: 'You\'re on the right track! Aim for 500+ to unlock "500+" badge and increase visibility.'
    });
    score += 5;
  } else {
    strengths.push({
      type: 'success',
      title: `Strong Network: ${connections} Connections`,
      description: 'Excellent network size! Continue engaging with your connections regularly.'
    });
    score += 10;
  }

  // About section
  const aboutLength = about.length;
  if (aboutLength === 0) {
    issues.push({
      type: 'error',
      title: 'About Section Missing',
      description: 'Current: 0 characters. Target: 1000-2000 characters. Write 3 paragraphs: (1) Who you are + years of experience, (2) Key achievements with numbers, (3) What you\'re looking for.'
    });
    actions.push('Write 1000+ character About section with your story, achievements, and career goals');
    score -= 15;
  } else if (aboutLength < 500) {
    optimizations.push({
      type: 'warning',
      title: `About Section Too Short: ${aboutLength} characters`,
      description: 'Expand to 1000-2000 characters. Add specific achievements, skills, and what makes you unique.'
    });
    actions.push('Expand About section with specific achievements and metrics');
    score -= 5;
  } else {
    strengths.push({
      type: 'success',
      title: `About Section: ${aboutLength} characters`,
      description: 'Good length! Make sure it includes specific achievements and keywords.'
    });
    score += 10;
  }

  // Experience analysis
  const experienceCount = experience.length;
  if (experienceCount === 0) {
    issues.push({
      type: 'error',
      title: 'No Work Experience Listed',
      description: 'Add your work history with 3-5 bullet points per role. Include metrics (%, $, time saved) to show impact.'
    });
    actions.push('Add work experience with quantifiable achievements');
    score -= 15;
  } else {
    strengths.push({
      type: 'success',
      title: `${experienceCount} Work Experience${experienceCount > 1 ? 's' : ''} Listed`,
      description: 'Good career history. Ensure each role has 3-5 bullet points with metrics (%, $, time saved, etc.).'
    });
    score += 10;
  }

  // Education analysis
  const educationCount = cleanEducation.length;
  if (educationCount === 0) {
    optimizations.push({
      type: 'warning',
      title: 'No Education Listed',
      description: 'Add your educational background including degrees, certifications, and relevant coursework.'
    });
    actions.push('Add educational qualifications and certifications');
    score -= 10;
  } else {
    // Don't show junk data warning, just use clean count
    strengths.push({
      type: 'success',
      title: `${educationCount} Education Entr${educationCount > 1 ? 'ies' : 'y'}`,
      description: 'Educational background is documented.'
    });
    score += 5;
  }

  // Skills analysis
  const skillsCount = skills.length;
  if (skillsCount === 0) {
    issues.push({
      type: 'error',
      title: 'No Skills Listed',
      description: 'Add 15+ skills including: (1) Technical skills (languages, tools), (2) Soft skills (leadership, communication), (3) Industry-specific skills. Get endorsements from colleagues.'
    });
    actions.push('Add 15+ relevant skills and request endorsements');
    score -= 15;
  } else if (skillsCount < 15) {
    optimizations.push({
      type: 'warning',
      title: `Only ${skillsCount} Skill${skillsCount > 1 ? 's' : ''} Listed`,
      description: `Add ${15 - skillsCount} more skills to reach 15+. Include technical skills, soft skills, and industry-specific expertise.`
    });
    actions.push(`Add ${15 - skillsCount} more skills to reach 15+ total`);
    score -= 5;
  } else {
    strengths.push({
      type: 'success',
      title: `${skillsCount} Skills Listed`,
      description: 'Good skill coverage! Make sure to get endorsements from colleagues.'
    });
    score += 10;
  }

  // Certifications
  const certsCount = certifications.length;
  if (certsCount === 0) {
    optimizations.push({
      type: 'warning',
      title: 'No Certifications',
      description: 'Add relevant certifications, courses, or training to demonstrate continuous learning.'
    });
    score -= 5;
  } else {
    strengths.push({
      type: 'success',
      title: `${certsCount} Certification${certsCount > 1 ? 's' : ''}`,
      description: 'Shows commitment to professional development.'
    });
    score += 5;
  }

  // Post analysis - Individual post insights
  // Handle both data structures: posts array with 'content' field OR experience array with 'description' field
  let validPosts = posts.filter((p: any) => p.content && p.content.length > 50 && !p.content.includes('Report this'));
  
  // If no valid posts in posts array, check experience array (scraper sometimes puts posts there)
  if (validPosts.length === 0 && experience.length > 0) {
    validPosts = experience
      .filter((exp: any) => exp.description && exp.description.length > 100 && !exp.description.startsWith('Report this'))
      .map((exp: any) => ({
        content: exp.description,
        likes: 0,
        comments: 0,
        shares: 0,
        hasHashtags: exp.description.includes('#'),
        wordCount: exp.description.split(/\s+/).length
      }));
  }
  
  if (validPosts.length === 0) {
    optimizations.push({
      type: 'warning',
      title: 'No Posts Found',
      description: 'Start posting 2-3 times per week. Share insights, achievements, and industry trends to increase visibility.'
    });
    postAnalysis.push({
      type: 'warning',
      title: 'No Content Activity',
      description: 'Create a content calendar: post industry insights, personal achievements, and tips weekly. Aim for 150-300 words per post with 3-5 hashtags.'
    });
    actions.push('Start posting 2-3 times per week with industry insights and achievements');
    score -= 10;
  } else {
    // Analyze each post
    postAnalysis.push({
      type: 'info',
      title: `${validPosts.length} Post${validPosts.length > 1 ? 's' : ''} Analyzed`,
      description: 'Here are specific improvements for your posts:'
    });
    score += 10;

    validPosts.slice(0, 5).forEach((post: any, index: number) => {
      const content = post.content || post.description || '';
      const wordCount = content.split(/\s+/).length;
      const hasHashtags = post.hasHashtags || content.includes('#');
      const engagement = (post.likes || 0) + (post.comments || 0);
      
      // Extract first 100 chars for preview
      const preview = content.substring(0, 100).replace(/\s+/g, ' ').trim();
      
      const postIssues = [];
      if (wordCount < 100) postIssues.push(`too short (${wordCount} words, aim for 150-300)`);
      if (!hasHashtags) postIssues.push('missing hashtags');
      if (engagement < 10) postIssues.push('low engagement');
      
      if (postIssues.length > 0) {
        postAnalysis.push({
          type: 'warning',
          title: `Post #${index + 1}: ${postIssues.join(', ')}`,
          description: `"${preview}..." - Improve by: ${!hasHashtags ? 'Add 3-5 relevant hashtags. ' : ''}${wordCount < 100 ? 'Expand content with storytelling and examples. ' : ''}${engagement < 10 ? 'Ask questions to boost engagement.' : ''}`
        });
      } else {
        postAnalysis.push({
          type: 'success',
          title: `Post #${index + 1}: Good quality`,
          description: `"${preview}..." - ${wordCount} words, ${hasHashtags ? 'has hashtags' : 'no hashtags'}, ${engagement} engagements. Keep it up!`
        });
      }
    });

    // Overall post insights
    const avgWordCount = validPosts.reduce((sum: number, p: any) => {
      const content = p.content || p.description || '';
      return sum + content.split(/\s+/).length;
    }, 0) / validPosts.length;
    const postsWithHashtags = validPosts.filter((p: any) => {
      const content = p.content || p.description || '';
      return p.hasHashtags || content.includes('#');
    }).length;
    
    if (postsWithHashtags < validPosts.length / 2) {
      postAnalysis.push({
        type: 'warning',
        title: 'Missing Hashtags in Most Posts',
        description: `Only ${postsWithHashtags}/${validPosts.length} posts have hashtags. Add 3-5 relevant hashtags to each post for better reach. Example: #Industry #Skill #Topic`
      });
    }

    if (avgWordCount < 100) {
      postAnalysis.push({
        type: 'warning',
        title: 'Posts Too Short Overall',
        description: `Average ${Math.round(avgWordCount)} words. Aim for 150-300 words for better engagement and storytelling.`
      });
    }
  }

  // Analytics-based insights
  if (analytics.profileCompleteness !== undefined) {
    if (analytics.profileCompleteness < 50) {
      issues.push({
        type: 'error',
        title: `Profile Only ${analytics.profileCompleteness}% Complete`,
        description: 'Complete profiles get 21x more views. Fill in all sections: About, Experience, Education, Skills, and Certifications.'
      });
    } else if (analytics.profileCompleteness < 80) {
      optimizations.push({
        type: 'warning',
        title: `Profile ${analytics.profileCompleteness}% Complete`,
        description: 'Almost there! Complete remaining sections to reach 100% and maximize visibility.'
      });
    } else {
      strengths.push({
        type: 'success',
        title: `Profile ${analytics.profileCompleteness}% Complete`,
        description: 'Excellent profile completeness! This significantly boosts your visibility.'
      });
    }
  }

  // Ensure we have at least 3 priority actions
  if (actions.length === 0) {
    actions.push('Complete all profile sections (About, Experience, Education, Skills)');
    actions.push('Grow your network to 500+ connections');
    actions.push('Start posting valuable content 2-3 times per week');
  }

  const result = {
    score: Math.max(0, Math.min(100, score)),
    scoreDescription: score >= 80 ? 'Excellent profile with minor improvements needed' : 
                      score >= 60 ? 'Good profile with room for optimization' : 
                      score >= 40 ? 'Profile needs significant improvements' :
                      'Profile requires major optimization',
    dataQualityIssues: issues,
    optimizations: optimizations,
    strengths: strengths,
    postAnalysis: postAnalysis.length > 0 ? postAnalysis : [{
      type: 'info',
      title: 'Content Strategy Needed',
      description: 'Build a content strategy: Share industry insights, personal achievements, lessons learned, and tips. Post 2-3 times per week.'
    }],
    priorityActions: actions.slice(0, 5)
  };
  
  console.log('✅ Analysis complete! Score:', result.score);
  return result;
}
