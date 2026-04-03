'use client';

import { useState } from 'react';
import GeometricBackground from '@/components/ui/geometric-background';
import { Sparkles, Loader2, FileText, Copy, CheckCircle } from 'lucide-react';

interface Repo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  url: string;
  topics: string[];
}

interface GeneratedPost {
  repo: Repo;
  post: string;
  hashtags: string[];
}

export default function GitHubPostsPage() {
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const extractUsername = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : url;
  };

  const fetchGitHubRepos = async () => {
    setLoading(true);
    setRepos([]);
    setGeneratedPosts([]);

    try {
      const username = extractUsername(githubUrl);
      
      // Fetch user's repositories
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      // GitHub API pagination - fetch ALL repos
      let allRepos: any[] = [];
      let page = 1;
      let hasMore = true;

      console.log('Fetching all repositories...');

      while (hasMore) {
        const response = await fetch(
          `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }

        const repos = await response.json();
        
        if (repos.length === 0) {
          hasMore = false;
        } else {
          allRepos = [...allRepos, ...repos];
          page++;
          console.log(`Fetched page ${page - 1}: ${repos.length} repos (Total: ${allRepos.length})`);
        }

        // Safety limit to prevent infinite loops
        if (page > 10) {
          console.log('Reached page limit (10 pages = 1000 repos)');
          hasMore = false;
        }
      }

      console.log(`Total repositories fetched: ${allRepos.length}`);
      
      // Filter out forks
      const nonForkRepos = allRepos.filter((repo: any) => !repo.fork);
      console.log(`Non-fork repositories: ${nonForkRepos.length}`);

      // Calculate quality score for each repo
      const reposWithScores = nonForkRepos.map((repo: any) => {
        const score = calculateRepoQualityScore(repo);
        return {
          ...repo,
          qualityScore: score
        };
      });

      // Sort by quality score (descending) and take top 5
      const topRepos = reposWithScores
        .sort((a: any, b: any) => b.qualityScore - a.qualityScore)
        .slice(0, 5)
        .map((repo: any) => ({
          name: repo.name,
          description: repo.description || 'No description available',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language || 'Unknown',
          url: repo.html_url,
          topics: repo.topics || [],
          qualityScore: repo.qualityScore
        }));

      console.log('Top 5 repositories by quality score:');
      topRepos.forEach(r => {
        console.log(`  - ${r.name} (Score: ${r.qualityScore.toFixed(2)}, Stars: ${r.stars}, Language: ${r.language})`);
      });

      setRepos(topRepos);
      
      // Generate posts for each repo
      await generatePostsForRepos(topRepos);
      
    } catch (error) {
      console.error('Error fetching repos:', error);
      alert('Error fetching repositories. Check your GitHub URL and token.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate repository quality score based on multiple factors
  const calculateRepoQualityScore = (repo: any): number => {
    let score = 0;

    // 1. Stars (0-30 points)
    // Logarithmic scale to prevent star-heavy bias
    const stars = repo.stargazers_count || 0;
    if (stars > 0) {
      score += Math.min(30, Math.log10(stars + 1) * 10);
    }

    // 2. Forks (0-15 points)
    const forks = repo.forks_count || 0;
    if (forks > 0) {
      score += Math.min(15, Math.log10(forks + 1) * 7);
    }

    // 3. Has description (0-10 points)
    if (repo.description && repo.description.length > 20) {
      score += 10;
    } else if (repo.description) {
      score += 5;
    }

    // 4. Has topics/tags (0-10 points)
    const topics = repo.topics || [];
    score += Math.min(10, topics.length * 2);

    // 5. Repository size (0-15 points)
    // Larger repos generally indicate more complexity
    const size = repo.size || 0; // in KB
    if (size > 10000) score += 15;      // > 10MB
    else if (size > 5000) score += 12;  // > 5MB
    else if (size > 1000) score += 10;  // > 1MB
    else if (size > 100) score += 7;    // > 100KB
    else if (size > 10) score += 4;     // > 10KB

    // 6. Has homepage/demo (0-5 points)
    if (repo.homepage) {
      score += 5;
    }

    // 7. Recently updated (0-10 points)
    const updatedAt = new Date(repo.updated_at);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) score += 10;       // Updated in last month
    else if (daysSinceUpdate < 90) score += 7;   // Updated in last 3 months
    else if (daysSinceUpdate < 180) score += 5;  // Updated in last 6 months
    else if (daysSinceUpdate < 365) score += 3;  // Updated in last year

    // 8. Has license (0-5 points)
    if (repo.license) {
      score += 5;
    }

    // 9. Language bonus (0-10 points)
    // Popular languages get slight bonus
    const language = repo.language?.toLowerCase() || '';
    const popularLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 'ruby', 'php'];
    if (popularLanguages.includes(language)) {
      score += 5;
    }
    if (language) {
      score += 5; // Any language is better than none
    }

    // 10. Watchers (0-5 points)
    const watchers = repo.watchers_count || 0;
    if (watchers > 0) {
      score += Math.min(5, Math.log10(watchers + 1) * 2);
    }

    // 11. Open issues (complexity indicator) (0-5 points)
    const openIssues = repo.open_issues_count || 0;
    if (openIssues > 0) {
      score += Math.min(5, Math.log10(openIssues + 1) * 2);
    }

    return score;
  };

  const generatePostsForRepos = async (repositories: Repo[]) => {
    const posts: GeneratedPost[] = [];

    for (const repo of repositories) {
      const post = generateLinkedInPost(repo);
      const hashtags = generateHashtags(repo);
      posts.push({ repo, post, hashtags });
    }

    setGeneratedPosts(posts);
  };

  const generateLinkedInPost = (repo: Repo) => {
    const templates = [
      // Template 1: Problem-Solution
      `🚀 Excited to share my latest project: ${repo.name}!

${repo.description}

This project solves a real problem I encountered while working on [specific use case]. Here's what makes it special:

✨ Key Features:
• Built with ${repo.language}
• ${repo.stars} developers already using it
• Open source and actively maintained

The journey of building this taught me valuable lessons about [technical concept]. The community response has been incredible!

Check it out and let me know what you think! 👇
${repo.url}`,

      // Template 2: Technical Deep Dive
      `💡 Deep dive into ${repo.name}

After ${repo.stars} stars and ${repo.forks} forks, here's what I learned building this ${repo.language} project:

${repo.description}

🔧 Technical Highlights:
→ Architecture decisions that scaled
→ Performance optimizations that mattered
→ Community contributions that shaped the project

The most surprising insight? [Key learning from the project]

Open source is about collaboration. Grateful for every contributor and user! 🙏

Explore the code: ${repo.url}`,

      // Template 3: Story-Based
      `📖 The story behind ${repo.name}

It started with a simple problem: [describe the problem]

${repo.description}

What began as a weekend project has now:
⭐ ${repo.stars} stars on GitHub
🔀 ${repo.forks} forks from the community
💻 Built with ${repo.language}

The best part? Seeing developers worldwide use it to solve their own challenges.

Every line of code represents a lesson learned. Every issue opened is an opportunity to improve.

Want to contribute or just explore? Link in comments! 👇`,

      // Template 4: Value-Focused
      `🎯 ${repo.name}: Solving real problems with code

${repo.description}

Why this matters:
• Saves developers hours of work
• Open source and free to use
• Battle-tested by ${repo.stars}+ users
• Written in ${repo.language} for performance

The tech community's support has been amazing. From bug reports to feature requests, every interaction makes this project better.

Building in public is challenging but rewarding. Here's to more open source! 🚀

GitHub: ${repo.url}`,

      // Template 5: Achievement-Focused
      `🏆 Milestone achieved: ${repo.name} hits ${repo.stars} stars!

${repo.description}

What started as an experiment in ${repo.language} has become a tool used by developers worldwide.

Key metrics:
⭐ ${repo.stars} GitHub stars
🔀 ${repo.forks} forks
💻 Active development
🌍 Global community

Lessons learned:
1. Start small, iterate fast
2. Listen to your users
3. Documentation matters
4. Community is everything

Thank you to everyone who contributed, reported issues, or simply used the project. You're the reason open source works! 🙌

Check it out: ${repo.url}`
    ];

    // Randomly select a template
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template;
  };

  const generateHashtags = (repo: Repo) => {
    const hashtags = new Set<string>();
    
    // Add language hashtag
    if (repo.language) {
      hashtags.add(`#${repo.language.replace(/\s+/g, '')}`);
    }
    
    // Add topic hashtags
    repo.topics.slice(0, 3).forEach(topic => {
      hashtags.add(`#${topic.replace(/\s+/g, '').replace(/-/g, '')}`);
    });
    
    // Add common tech hashtags
    hashtags.add('#OpenSource');
    hashtags.add('#GitHub');
    hashtags.add('#Coding');
    hashtags.add('#SoftwareDevelopment');
    hashtags.add('#Programming');
    
    return Array.from(hashtags).slice(0, 8);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <GeometricBackground />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <h1 className="text-5xl font-bold">GitHub to LinkedIn Posts</h1>
          </div>
          <p className="text-xl text-gray-400">
            Transform your GitHub repos into engaging LinkedIn posts
          </p>
        </header>

        {/* Input Section */}
        {!loading && generatedPosts.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Enter Your GitHub Profile</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    GitHub URL or Username
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username or just username"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    GitHub Token (Optional - for higher rate limits)
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Get your token from: Settings → Developer settings → Personal access tokens
                  </p>
                </div>

                <button
                  onClick={fetchGitHubRepos}
                  disabled={!githubUrl}
                  className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate LinkedIn Posts
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-white/5 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold mb-3 text-white">How it works:</h3>
              <ol className="space-y-2 text-sm text-gray-400">
                <li>1. Enter your GitHub username or profile URL</li>
                <li>2. Optionally add a GitHub token for higher rate limits</li>
                <li>3. We'll fetch your top 5 repositories (by stars)</li>
                <li>4. Generate 5 unique LinkedIn posts for each repo</li>
                <li>5. Copy and post to LinkedIn!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 animate-spin mb-4" />
            <p className="text-lg">Fetching all your repositories...</p>
            <p className="text-gray-400 text-sm">This may take 10-30 seconds for large profiles</p>
            <p className="text-gray-500 text-xs mt-2">Check browser console for progress</p>
          </div>
        )}

        {/* Generated Posts */}
        {!loading && generatedPosts.length > 0 && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header with Reset */}
            <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Generated Posts</h2>
                  <p className="text-gray-400">Top {generatedPosts.length} repositories from your GitHub</p>
                </div>
                <button
                  onClick={() => {
                    setGeneratedPosts([]);
                    setRepos([]);
                    setGithubUrl('');
                  }}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Generate New
                </button>
              </div>
            </div>

            {/* Posts */}
            {generatedPosts.map((item, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                {/* Repo Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {item.repo.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">{item.repo.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>⭐ {item.repo.stars} stars</span>
                      <span>🔀 {item.repo.forks} forks</span>
                      <span>💻 {item.repo.language}</span>
                    </div>
                  </div>
                </div>

                {/* Generated Post */}
                <div className="bg-black/50 rounded-lg p-4 mb-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
                    {item.post}
                  </pre>
                </div>

                {/* Hashtags */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Suggested Hashtags:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.hashtags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(`${item.post}\n\n${item.hashtags.join(' ')}`, index)}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Post with Hashtags
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
