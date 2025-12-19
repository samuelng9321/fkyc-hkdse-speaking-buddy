import React from 'react';
import { Topic } from '../types';
import { MessageCircle, ThumbsUp, GitBranch, HelpCircle, Ear } from 'lucide-react';

interface DirectoryProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
}

const Directory: React.FC<DirectoryProps> = ({ topics, onSelectTopic }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'benefits-drawbacks': return <MessageCircle className="w-8 h-8 text-blue-500" />;
      case 'agreement-disagreement': return <ThumbsUp className="w-8 h-8 text-green-500" />;
      case 'tree-turn': return <GitBranch className="w-8 h-8 text-purple-500" />;
      case 'explaining-choices': return <HelpCircle className="w-8 h-8 text-orange-500" />;
      case 'active-listening': return <Ear className="w-8 h-8 text-red-500" />;
      default: return <MessageCircle className="w-8 h-8 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-4">Select a Practice Topic</h1>
          <p className="text-lg text-slate-600">Choose a skill to master for your HKDSE Speaking Exam</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 text-left flex flex-col h-full hover:-translate-y-1"
            >
              <div className="mb-4 bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                {getIcon(topic.id)}
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                {topic.title}
              </h3>
              
              <p className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wide">
                Scenario: {topic.scenarioTitle}
              </p>
              
              <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                {topic.scenarioDescription}
              </p>

              <div className="flex items-center text-indigo-600 font-bold text-sm">
                Start Practice 
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Directory;