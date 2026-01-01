'use client';

import { useState, useMemo } from 'react';
import {
  Skill,
  SKILL_LEVELS,
  SortOption,
  SORT_OPTIONS,
  SkillLevel,
} from './skill-types';

// Sample skills data - replace with your actual skills
const SAMPLE_SKILLS: Skill[] = [
  {
    id: '1',
    name: 'React',
    category: 'Frontend',
    currentLevel: 'Senior',
    yearsOfExperience: 5,
    yearsOfProfessionalExperience: 4,
    employabilityScore: 9,
    description: 'Building complex UIs with React, hooks, and state management.',
  },
  {
    id: '2',
    name: 'TypeScript',
    category: 'Languages',
    currentLevel: 'Senior',
    yearsOfExperience: 4,
    yearsOfProfessionalExperience: 3,
    employabilityScore: 9,
    description: 'Strong typing, generics, and advanced type patterns.',
  },
  {
    id: '3',
    name: 'Node.js',
    category: 'Backend',
    currentLevel: 'Staff Engineer',
    yearsOfExperience: 3,
    yearsOfProfessionalExperience: 2,
    employabilityScore: 8,
    description: 'Server-side JavaScript, Express, and API development.',
  },
  {
    id: '4',
    name: 'Python',
    category: 'Languages',
    currentLevel: 'Staff Engineer',
    yearsOfExperience: 3,
    yearsOfProfessionalExperience: 2,
    employabilityScore: 8,
    description: 'Django, Flask, and data processing scripts.',
  },
  {
    id: '5',
    name: 'Docker',
    category: 'DevOps',
    currentLevel: 'Script Kitty',
    yearsOfExperience: 2,
    yearsOfProfessionalExperience: 1,
    employabilityScore: 7,
    description: 'Container basics and Docker Compose.',
  },
  {
    id: '6',
    name: 'AWS',
    category: 'Cloud',
    currentLevel: 'Staff Engineer',
    yearsOfExperience: 2,
    yearsOfProfessionalExperience: 2,
    employabilityScore: 9,
    description: 'EC2, S3, Lambda, and basic infrastructure.',
  },
  {
    id: '7',
    name: 'PostgreSQL',
    category: 'Databases',
    currentLevel: 'Senior',
    yearsOfExperience: 4,
    yearsOfProfessionalExperience: 3,
    employabilityScore: 8,
    description: 'Complex queries, optimization, and schema design.',
  },
  {
    id: '8',
    name: 'Rust',
    category: 'Languages',
    currentLevel: 'Script Kitty',
    yearsOfExperience: 1,
    yearsOfProfessionalExperience: 0,
    employabilityScore: 6,
    description: 'Learning systems programming and memory safety.',
  },
];

function getLevelIndex(level: SkillLevel): number {
  return SKILL_LEVELS.indexOf(level);
}

function getProgressPercentage(level: SkillLevel): number {
  const index = getLevelIndex(level);
  return ((index + 1) / SKILL_LEVELS.length) * 100;
}

function getLevelColor(level: SkillLevel): string {
  const colors: Record<SkillLevel, string> = {
    'Script Kitty': 'from-rose-500 to-orange-400',
    'Staff Engineer': 'from-amber-500 to-yellow-400',
    'Senior': 'from-emerald-500 to-teal-400',
    'Distinguished Engineer': 'from-blue-500 to-cyan-400',
    'Fellow': 'from-violet-500 to-purple-400',
  };
  return colors[level];
}

function SkillCard({ skill }: { skill: Skill }) {
  const progress = getProgressPercentage(skill.currentLevel);
  const gradientClass = getLevelColor(skill.currentLevel);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      {/* Decorative gradient orb */}
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradientClass} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
      />

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {skill.name}
          </h3>
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {skill.category}
          </span>
        </div>
        <span
          className={`rounded-full bg-gradient-to-r ${gradientClass} px-3 py-1 text-xs font-semibold text-white shadow-sm`}
        >
          {skill.currentLevel}
        </span>
      </div>

      {/* Description */}
      {skill.description && (
        <p
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {skill.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="mb-2 flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Script Kitty</span>
          <span style={{ color: 'var(--text-muted)' }}>Fellow</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--border-color)' }}
        >
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Level markers */}
        <div className="relative mt-1 flex justify-between">
          {SKILL_LEVELS.map((level, index) => (
            <div
              key={level}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                getLevelIndex(skill.currentLevel) >= index
                  ? `bg-gradient-to-r ${gradientClass}`
                  : ''
              }`}
              style={
                getLevelIndex(skill.currentLevel) < index
                  ? { backgroundColor: 'var(--border-color)' }
                  : undefined
              }
              title={level}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex gap-4 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Experience
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {skill.yearsOfExperience} yrs
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Professional
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {skill.yearsOfProfessionalExperience} yrs
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Employability
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {skill.employabilityScore}/10
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SkillTreePage() {
  const [sortBy, setSortBy] = useState<SortOption>('easiest-to-employ');

  const sortedSkills = useMemo(() => {
    const skills = [...SAMPLE_SKILLS];

    switch (sortBy) {
      case 'easiest-to-employ':
        return skills.sort((a, b) => b.employabilityScore - a.employabilityScore);
      case 'years-of-experience':
        return skills.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
      case 'years-of-professional-experience':
        return skills.sort(
          (a, b) => b.yearsOfProfessionalExperience - a.yearsOfProfessionalExperience
        );
      default:
        return skills;
    }
  }, [sortBy]);

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Skill Tree</h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Track your progression from Script Kitty to Fellow across different
          technologies and skills.
        </p>
      </div>

      {/* Progress Legend */}
      <div
        className="mb-8 overflow-hidden rounded-xl border p-5"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h2
          className="mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Skill Levels
        </h2>
        <div className="flex flex-wrap gap-3">
          {SKILL_LEVELS.map((level) => (
            <div
              key={level}
              className={`flex items-center gap-2 rounded-lg bg-gradient-to-r ${getLevelColor(
                level
              )} px-4 py-2 text-sm font-medium text-white shadow-sm`}
            >
              <span className="text-white/80">{SKILL_LEVELS.indexOf(level) + 1}.</span>
              {level}
            </div>
          ))}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-6 flex items-center gap-4">
        <label
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Sort by:
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent-purple"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Skills Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSkills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
}
