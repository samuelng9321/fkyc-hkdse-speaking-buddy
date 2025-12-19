import React from 'react';
import { Topic } from '../types';
import { BookOpen, PieChart, MessageCircle } from 'lucide-react';

interface ReferencePanelProps {
  topic: Topic;
}

const ReferencePanel: React.FC<ReferencePanelProps> = ({ topic }) => {
  const { targetExpressions: expressions, scenarioTitle, scenarioDescription, id } = topic;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 bg-white shadow-inner custom-scrollbar">
      <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        Task Materials
      </h2>

      {/* Target Expressions - STICKY / Highlighted */}
      <div className="mb-6 md:mb-8 bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-sm md:text-base">
          <MessageCircle className="w-4 h-4" />
          Target Expressions (REQUIRED)
        </h3>
        <ul className="space-y-2">
          {expressions.map((exp) => (
            <li key={exp.id} className="text-xs md:text-sm text-indigo-800 bg-white px-3 py-2 rounded-md border border-indigo-100 shadow-sm font-medium">
              {exp.id}. {exp.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Context / Prompt */}
      <div className="mb-6 md:mb-8">
        <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2 text-sm md:text-base">
            Discussion Topic: {scenarioTitle}
        </h3>
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-4">
          {scenarioDescription}
        </p>
      </div>

      {/* Data Tables Visualization - Conditionally rendered only for the Blog topic */}
      {id === 'benefits-drawbacks' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
              <PieChart className="w-4 h-4" />
              Market Research Data
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2">Region</th>
                    <th className="px-3 py-2">Read Blogs</th>
                    <th className="px-3 py-2">Write Blogs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-2 font-medium">Hong Kong</td>
                    <td className="px-3 py-2 text-green-600 font-bold">77%</td>
                    <td className="px-3 py-2">52%</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">U.S.</td>
                    <td className="px-3 py-2">40%</td>
                    <td className="px-3 py-2">18%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Popular Blog Topics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="block font-bold">News</span>
                  59% Read / 35% Write
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="block font-bold">Shopping</span>
                  51% Read / 35% Write
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="block font-bold">Health</span>
                  41% Read / 34% Write
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Student Survey</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex justify-between">
                  <span>Want exam strategies:</span>
                  <span className="font-bold">80%</span>
              </li>
              <li className="flex justify-between">
                  <span>Willing to contribute:</span>
                  <span className="font-bold">70%</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferencePanel;