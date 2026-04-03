from typing import Dict, List, Any
import re

class ProfileAnalyzer:
    def __init__(self):
        self.weights = {
            'headline': 15,
            'about': 20,
            'experience': 25,
            'skills': 20,
            'education': 15,
            'completeness': 5
        }
        
        # Keywords for different roles
        self.power_words = ['expert', 'specialist', 'lead', 'senior', 'manager', 'director', 
                           'architect', 'engineer', 'developer', 'designer', 'consultant']
        self.action_verbs = ['built', 'created', 'led', 'managed', 'developed', 'designed',
                            'implemented', 'launched', 'achieved', 'increased', 'improved']
    
    def analyze(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Deep analysis of LinkedIn profile including posts and achievements"""
        
        scores = {}
        insights = []
        recommendations = []
        strengths = []
        weaknesses = []
        
        name = profile.get('name', '')
        headline = profile.get('headline', '')
        about = profile.get('about', '')
        aboutAnalysis = profile.get('aboutAnalysis', {})
        experience = profile.get('experience', [])
        skills = profile.get('skills', [])
        education = profile.get('education', [])
        certifications = profile.get('certifications', [])
        connections = profile.get('connections', '0')
        followers = profile.get('followers', '0')
        posts = profile.get('posts', [])
        activity = profile.get('activity', {})
        
        # Network strength analysis
        conn_num = int(''.join(filter(str.isdigit, str(connections))) or 0)
        if conn_num >= 500:
            strengths.append(f"Strong network: {connections} connections")
            insights.append({
                "type": "good",
                "message": f"✓ Excellent network size: {connections} connections"
            })
        elif conn_num >= 100:
            insights.append({
                "type": "info",
                "message": f"💡 Good network ({connections}). Keep connecting with industry peers"
            })
        else:
            insights.append({
                "type": "warning",
                "message": f"⚠ Build your network (currently {connections}). Aim for 500+"
            })
            recommendations.append("Connect with colleagues, classmates, and industry professionals")
        
        # Analyze headline
        headline_score = self._analyze_headline(headline)
        scores['headline'] = headline_score
        
        if headline_score >= 80:
            strengths.append("Strong headline with clear positioning")
            insights.append({
                "type": "good",
                "message": "✓ Headline is compelling and keyword-optimized"
            })
        elif headline_score >= 50:
            insights.append({
                "type": "warning",
                "message": f"⚠ Headline is {len(headline)} chars. Add your specialty and value (e.g., 'Senior Developer | Python Expert | Building Scalable Systems')"
            })
            recommendations.append("Use format: [Role] | [Expertise] | [Value Proposition]")
        else:
            weaknesses.append("Weak or missing headline")
            insights.append({
                "type": "warning",
                "message": "⚠ Create a powerful headline with keywords recruiters search for"
            })
            recommendations.append("Add headline with your role, skills, and what you do")
        
        # Check for power words in headline
        has_power_words = any(word in headline.lower() for word in self.power_words)
        if not has_power_words and headline:
            insights.append({
                "type": "info",
                "message": "💡 Add power words like 'Expert', 'Specialist', 'Lead' to your headline"
            })
        
        # Analyze about section
        about_score = self._analyze_about(about)
        scores['about'] = about_score
        about_words = len(about.split()) if about else 0
        
        if about_words == 0:
            weaknesses.append("Missing About section")
            insights.append({
                "type": "warning",
                "message": "⚠ Add an About section (200-300 words) telling your story"
            })
            recommendations.append("Write about: Who you are, what you do, your achievements, what you're looking for")
        elif about_words < 100:
            insights.append({
                "type": "warning",
                "message": f"⚠ About section is only {about_words} words. Expand to 200-300 words"
            })
            recommendations.append("Add: Your unique value, key achievements, career goals")
        elif about_words >= 200:
            strengths.append("Comprehensive About section")
            insights.append({
                "type": "good",
                "message": f"✓ About section is detailed ({about_words} words)"
            })
        
        # Check for action verbs in about
        if about:
            has_action_verbs = any(verb in about.lower() for verb in self.action_verbs)
            if not has_action_verbs:
                insights.append({
                    "type": "info",
                    "message": "💡 Use action verbs: 'Built', 'Led', 'Achieved', 'Increased' to show impact"
                })
        
        # Analyze experience
        exp_score = self._analyze_experience(experience)
        scores['experience'] = exp_score
        
        if len(experience) >= 3:
            strengths.append(f"{len(experience)} work experiences listed")
            insights.append({
                "type": "good",
                "message": f"✓ {len(experience)} positions show career growth"
            })
        elif len(experience) > 0:
            insights.append({
                "type": "info",
                "message": f"💡 Add more past roles (currently {len(experience)}). Include internships, freelance work"
            })
        else:
            weaknesses.append("No experience listed")
            insights.append({
                "type": "warning",
                "message": "⚠ Add your work experience with bullet points showing achievements"
            })
        
        # Check experience descriptions
        if experience and len(experience) > 0:
            first_exp = experience[0]
            if 'title' in first_exp and len(str(first_exp.get('title', ''))) < 10:
                insights.append({
                    "type": "info",
                    "message": "💡 Add detailed descriptions to each role with quantifiable achievements"
                })
        
        # Analyze skills
        skill_score = self._analyze_skills(skills)
        scores['skills'] = skill_score
        
        if len(skills) == 0:
            weaknesses.append("No skills listed")
            insights.append({
                "type": "warning",
                "message": "⚠ Add 15-20 relevant skills. This is crucial for recruiter searches!"
            })
            recommendations.append("Add technical skills, soft skills, tools, and certifications")
        elif len(skills) < 10:
            insights.append({
                "type": "warning",
                "message": f"⚠ Only {len(skills)} skills listed. Add {15 - len(skills)} more to reach 15+"
            })
            recommendations.append("Add: Industry-specific skills, software tools, methodologies")
        elif len(skills) >= 15:
            strengths.append(f"{len(skills)} skills showcased")
            insights.append({
                "type": "good",
                "message": f"✓ Great! {len(skills)} skills make you discoverable in searches"
            })
        
        # Analyze education
        edu_score = self._analyze_education(education)
        scores['education'] = edu_score
        
        if len(education) > 0:
            strengths.append("Education credentials added")
        else:
            insights.append({
                "type": "info",
                "message": "💡 Add your education (degree, certifications, courses)"
            })
        
        # Profile completeness check
        completeness_items = []
        if name: completeness_items.append('name')
        if headline: completeness_items.append('headline')
        if about: completeness_items.append('about')
        if experience: completeness_items.append('experience')
        if skills: completeness_items.append('skills')
        if education: completeness_items.append('education')
        
        completeness = (len(completeness_items) / 6) * 100
        
        if completeness < 100:
            missing = []
            if not headline: missing.append('headline')
            if not about: missing.append('about section')
            if not experience: missing.append('experience')
            if not skills: missing.append('skills')
            if not education: missing.append('education')
            
            insights.append({
                "type": "info",
                "message": f"📋 Profile is {int(completeness)}% complete. Add: {', '.join(missing)}"
            })
        
        # Calculate overall score
        total_score = sum(scores[key] * self.weights[key] / 100 for key in scores)
        
        # Priority recommendations
        if not headline or headline_score < 50:
            recommendations.insert(0, "🎯 PRIORITY: Create a keyword-rich headline")
        if about_words < 100:
            recommendations.insert(0 if not recommendations else 1, "🎯 PRIORITY: Write a compelling About section")
        if len(skills) < 10:
            recommendations.insert(0 if not recommendations else 2, "🎯 PRIORITY: Add at least 15 skills")
        
        return {
            "score": int(total_score),
            "insights": insights[:8],  # Top 8 insights
            "recommendations": recommendations[:5],  # Top 5 recommendations
            "strengths": strengths,
            "weaknesses": weaknesses
        }
    
    def _analyze_headline(self, headline: str) -> int:
        if not headline:
            return 0
        score = 50
        if len(headline) > 30:
            score += 20
        if any(word in headline.lower() for word in ['expert', 'specialist', 'engineer', 'manager', 'developer']):
            score += 15
        if '|' in headline or '•' in headline:
            score += 15
        return min(score, 100)
    
    def _analyze_about(self, about: str) -> int:
        if not about:
            return 0
        words = len(about.split())
        if words < 50:
            return 30
        elif words < 100:
            return 50
        elif words < 200:
            return 75
        else:
            return 95
    
    def _analyze_experience(self, experience: List[Dict]) -> int:
        if not experience:
            return 0
        score = min(len(experience) * 25, 100)
        return score
    
    def _analyze_skills(self, skills: List[str]) -> int:
        if not skills:
            return 0
        score = min(len(skills) * 5, 100)
        return score
    
    def _analyze_education(self, education: List[Dict]) -> int:
        if not education:
            return 50
        return min(len(education) * 50, 100)

        
        # About section deep analysis
        if aboutAnalysis:
            if aboutAnalysis.get('hasActionVerbs'):
                strengths.append("About section uses action verbs")
            else:
                insights.append({
                    "type": "info",
                    "message": "💡 Add action verbs to About: 'Built', 'Led', 'Achieved', 'Delivered'"
                })
            
            if aboutAnalysis.get('hasNumbers') or aboutAnalysis.get('hasPercentages'):
                strengths.append("About section includes quantifiable achievements")
                insights.append({
                    "type": "good",
                    "message": "✓ Great! Your About section has numbers/metrics"
                })
            else:
                insights.append({
                    "type": "warning",
                    "message": "⚠ Add numbers to About: '30% increase', '5 years', '$1M revenue'"
                })
        
        # Experience deep analysis
        if experience:
            exp_with_achievements = sum(1 for exp in experience if exp.get('hasQuantifiableResults'))
            exp_with_bullets = sum(1 for exp in experience if exp.get('bulletPoints', 0) > 0)
            
            if exp_with_achievements > 0:
                strengths.append(f"{exp_with_achievements} roles with quantifiable achievements")
                insights.append({
                    "type": "good",
                    "message": f"✓ {exp_with_achievements} roles show measurable impact"
                })
            else:
                insights.append({
                    "type": "warning",
                    "message": "⚠ Add numbers to experience: 'Increased sales by 40%', 'Led team of 10'"
                })
                recommendations.append("Add quantifiable achievements to each role")
            
            # Check for detailed descriptions
            short_descriptions = sum(1 for exp in experience if exp.get('descriptionLength', 0) < 100)
            if short_descriptions > len(experience) / 2:
                insights.append({
                    "type": "info",
                    "message": f"💡 {short_descriptions} roles need detailed descriptions with bullet points"
                })
        
        # Skills analysis with endorsements
        if isinstance(skills, list) and len(skills) > 0:
            if isinstance(skills[0], dict):
                endorsed_skills = [s for s in skills if s.get('endorsements', 0) > 0]
                if endorsed_skills:
                    avg_endorsements = sum(s.get('endorsements', 0) for s in endorsed_skills) / len(endorsed_skills)
                    insights.append({
                        "type": "good",
                        "message": f"✓ Skills have avg {int(avg_endorsements)} endorsements"
                    })
                else:
                    insights.append({
                        "type": "info",
                        "message": "💡 Ask colleagues to endorse your top skills"
                    })
        
        # Certifications analysis
        if certifications and len(certifications) > 0:
            strengths.append(f"{len(certifications)} certifications listed")
            insights.append({
                "type": "good",
                "message": f"✓ {len(certifications)} certifications boost credibility"
            })
        else:
            insights.append({
                "type": "info",
                "message": "💡 Add certifications (Coursera, Udemy, industry certs)"
            })
        
        # Posts/Activity analysis
        if posts and len(posts) > 0:
            avg_engagement = activity.get('avgLikes', 0) + activity.get('avgComments', 0)
            
            if avg_engagement > 50:
                strengths.append("High post engagement")
                insights.append({
                    "type": "good",
                    "message": f"✓ Excellent engagement: avg {avg_engagement} reactions per post"
                })
            elif avg_engagement > 10:
                insights.append({
                    "type": "info",
                    "message": f"💡 Good engagement ({avg_engagement}/post). Post more consistently"
                })
            else:
                insights.append({
                    "type": "warning",
                    "message": "⚠ Low post engagement. Try: industry insights, personal stories, tips"
                })
            
            # Content quality analysis
            posts_with_hashtags = activity.get('postsWithHashtags', 0)
            posts_with_media = activity.get('postsWithMedia', 0)
            
            if posts_with_hashtags < len(posts) / 2:
                insights.append({
                    "type": "info",
                    "message": "💡 Use 3-5 relevant hashtags per post for better reach"
                })
            
            if posts_with_media < len(posts) / 2:
                insights.append({
                    "type": "info",
                    "message": "💡 Posts with images/videos get 2x more engagement"
                })
                recommendations.append("Add visuals to your posts (images, infographics, videos)")
        else:
            insights.append({
                "type": "warning",
                "message": "⚠ No recent posts found. Share content weekly to stay visible"
            })
            recommendations.append("Post 2-3 times per week: industry insights, achievements, tips")
        
        # Calculate comprehensive score
        total_score = (
            headline_score * 0.10 +
            about_score * 0.15 +
            exp_score * 0.20 +
            skill_score * 0.15 +
            edu_score * 0.10 +
            (len(certifications) * 5) +
            (min(conn_num / 10, 15)) +
            (min(len(posts) * 2, 10))
        )
        
        return {
            "score": int(min(total_score, 100)),
            "insights": insights[:10],
            "recommendations": recommendations[:6],
            "strengths": strengths,
            "weaknesses": weaknesses,
            "detailedMetrics": {
                "connections": connections,
                "followers": followers,
                "postsAnalyzed": len(posts),
                "avgEngagement": activity.get('avgLikes', 0) + activity.get('avgComments', 0),
                "certificationsCount": len(certifications),
                "skillsCount": len(skills),
                "experienceCount": len(experience)
            }
        }
