'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Skill,
  SKILL_LEVELS,
  SortOption,
  SORT_OPTIONS,
  SkillLevel,
} from './skill-types';

// Import all skills from skills-bank
import reactSkill from './skills-bank/react.json';
import typescriptSkill from './skills-bank/typescript.json';
import nodejsSkill from './skills-bank/nodejs.json';
import pythonSkill from './skills-bank/python.json';
import dockerSkill from './skills-bank/docker.json';
import dotnetSkill from './skills-bank/dotnet.json';
import javaSkill from './skills-bank/java.json';
import awsSkill from './skills-bank/aws.json';
import postgresqlSkill from './skills-bank/postgresql.json';
import rustSkill from './skills-bank/rust.json';

// Load skills from JSON files
const SKILLS: Skill[] = [
  reactSkill as Skill,
  typescriptSkill as Skill,
  nodejsSkill as Skill,
  pythonSkill as Skill,
  dockerSkill as Skill,
  dotnetSkill as Skill,
  javaSkill as Skill,
  awsSkill as Skill,
  postgresqlSkill as Skill,
  rustSkill as Skill,
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

      {/* See Work Button */}
      <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
        <Link
          href={`/skill-tree/${skill.id}`}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r ${gradientClass} px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md`}
        >
          See Work
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function SkillTreePage() {
  const [sortBy, setSortBy] = useState<SortOption>('easiest-to-employ');

  const sortedSkills = useMemo(() => {
    const skills = [...SKILLS];

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

      {/* Grading System Explanation */}
      <div
        className="mt-12 overflow-hidden rounded-xl border p-6"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h2 className="mb-3 text-lg font-semibold">Understanding the Grading System</h2>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Skills are evaluated on a 5-level progression from <strong>Script Kitty</strong> (beginner) 
          to <strong>Fellow</strong> (world-class expert). Each level represents not just years of 
          experience, but depth of knowledge, professional application, and ability to mentor others.
        </p>
        <Link
          href="/skill-tree/skill-tree-grading"
          className="inline-flex items-center gap-2 font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--accent-primary)' }}
        >
          Learn More About the Grading System
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
