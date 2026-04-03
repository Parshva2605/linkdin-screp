'use client';

import { Download, RefreshCw, AlertCircle, Lightbulb, CheckCircle, FileText, Target } from 'lucide-react';

interface AnalysisResultsProps {
  analysis: any;
  profileData: any;
  onReset: () => void;
}

export default function AnalysisResults({ analysis, profileData, onReset }: AnalysisResultsProps) {
  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      profileUrl: profileData.url,
      analysis: analysis
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-optimization-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Analysis Complete!</h2>
            <p className="text-gray-400">{profileData.url}</p>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze Another
          </button>
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-8">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - (analysis.score || 0) / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">{analysis.score || 0}</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 text-white">Profile Quality Score</h3>
            <p className="text-gray-300">{analysis.scoreDescription || 'Analyzing...'}</p>
          </div>
        </div>
      </div>

      {/* Data Quality Issues */}
      {analysis.dataQualityIssues && analysis.dataQualityIssues.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            Data Quality Issues
          </h3>
          <div className="space-y-3">
            {analysis.dataQualityIssues.map((issue: any, index: number) => (
              <div key={index} className="flex gap-4 p-4 bg-red-500/10 rounded-lg border-l-4 border-red-500">
                <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                  ✕
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{issue.title}</h4>
                  <p className="text-gray-400 text-sm mt-1">{issue.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimizations */}
      {analysis.optimizations && analysis.optimizations.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-400" />
            Optimization Suggestions
          </h3>
          <div className="space-y-3">
            {analysis.optimizations.map((opt: any, index: number) => (
              <div key={index} className="flex gap-4 p-4 bg-yellow-500/10 rounded-lg border-l-4 border-yellow-500">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold">
                  !
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{opt.title}</h4>
                  <p className="text-gray-400 text-sm mt-1">{opt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Your Strengths
          </h3>
          <div className="space-y-3">
            {analysis.strengths.map((strength: any, index: number) => (
              <div key={index} className="flex gap-4 p-4 bg-green-500/10 rounded-lg border-l-4 border-green-500">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{strength.title}</h4>
                  <p className="text-gray-400 text-sm mt-1">{strength.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post Analysis */}
      {analysis.postAnalysis && analysis.postAnalysis.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            Post Optimization
          </h3>
          <div className="space-y-3">
            {analysis.postAnalysis.map((post: any, index: number) => (
              <div key={index} className="flex gap-4 p-4 bg-blue-500/10 rounded-lg border-l-4 border-blue-500">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  📝
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{post.title}</h4>
                  <p className="text-gray-400 text-sm mt-1">{post.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Actions */}
      {analysis.priorityActions && analysis.priorityActions.length > 0 && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            <Target className="w-6 h-6" />
            Priority Actions
          </h3>
          <div className="space-y-3">
            {analysis.priorityActions.map((action: string, index: number) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <p className="flex-1 pt-1 text-gray-300">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={exportReport}
          className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-200 font-semibold flex items-center gap-2 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>
    </div>
  );
}
