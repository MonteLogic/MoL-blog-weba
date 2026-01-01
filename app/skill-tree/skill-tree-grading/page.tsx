'use client';

import Link from 'next/link';
import { SKILL_LEVELS, SkillLevel } from '../skill-types';

const LEVEL_DETAILS: Record<SkillLevel, { description: string; criteria: string[]; color: string }> = {
  'Script Kitty': {
    description: 'Beginning your journey. You can follow tutorials and documentation to accomplish tasks.',
    criteria: [
      'Can set up development environment with guidance',
      'Follows tutorials and documentation successfully',
      'Understands basic concepts and terminology',
      'Less than 1 year of focused experience',
    ],
    color: 'from-rose-500 to-orange-400',
  },
  'Staff Engineer': {
    description: 'Building competency. You can work independently on standard tasks and understand architectural patterns.',
    criteria: [
      'Works independently on well-defined tasks',
      'Understands common patterns and best practices',
      'Can debug issues with some research',
      '1-3 years of experience',
    ],
    color: 'from-amber-500 to-yellow-400',
  },
  'Senior': {
    description: 'Expert level. You can design and implement complex systems, mentor others, and make architectural decisions.',
    criteria: [
      'Designs and implements complex features',
      'Mentors junior developers effectively',
      'Makes sound architectural decisions',
      '3-5+ years of deep experience',
    ],
    color: 'from-emerald-500 to-teal-400',
  },
  'Distinguished Engineer': {
    description: 'Industry leader. You influence technology direction, have deep expertise, and are recognized in the community.',
    criteria: [
      'Recognized expert in the technology',
      'Influences technology direction at org level',
      'Contributes to open source / community',
      '5-10+ years with significant impact',
    ],
    color: 'from-blue-500 to-cyan-400',
  },
  'Fellow': {
    description: 'World-class expert. You define industry standards, create foundational technologies, and are globally recognized.',
    criteria: [
      'Defines industry standards and best practices',
      'Creates foundational technologies or frameworks',
      'Globally recognized thought leader',
      '10+ years with transformative contributions',
    ],
    color: 'from-violet-500 to-purple-400',
  },
};

export default function SkillTreeGradingPage() {
  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/skill-tree"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Skill Tree
        </Link>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Skill Tree Grading System</h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Understanding the progression levels from Script Kitty to Fellow.
        </p>
      </div>

      {/* Overview */}
      <div
        className="mb-8 overflow-hidden rounded-xl border p-6"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h2 className="mb-4 text-xl font-semibold">How Skill Levels Are Determined</h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Each skill is evaluated based on multiple factors including years of experience, 
          depth of knowledge, professional application, and ability to mentor others. 
          The grading is self-assessed but aims to be honest and reflective of actual capability.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>5</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Progression Levels</div>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>Years</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Experience Matters</div>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>Impact</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Real-world Application</div>
          </div>
        </div>
      </div>

      {/* Level Details */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Skill Level Breakdown</h2>
        {SKILL_LEVELS.map((level, index) => {
          const details = LEVEL_DETAILS[level];
          return (
            <div
              key={level}
              className="overflow-hidden rounded-xl border"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div className={`bg-gradient-to-r ${details.color} px-6 py-4`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-bold text-white">{level}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {details.description}
                </p>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Key Criteria
                </h4>
                <ul className="space-y-2">
                  {details.criteria.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <svg 
                        className="mt-0.5 h-5 w-5 flex-shrink-0" 
                        style={{ color: 'var(--accent-primary)' }}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ color: 'var(--text-secondary)' }}>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div
        className="mt-8 overflow-hidden rounded-xl border p-6 text-center"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h3 className="mb-2 text-lg font-semibold">Ready to explore skills?</h3>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          View the full skill tree to see progression across different technologies.
        </p>
        <Link
          href="/skill-tree"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-400 px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
        >
          View Skill Tree
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
