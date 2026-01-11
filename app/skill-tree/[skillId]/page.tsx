'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SKILL_LEVELS, SkillLevel, Skill } from '../skill-types';

// Import all skills from skills-bank
import reactSkill from '../skills-bank/react.json';
import typescriptSkill from '../skills-bank/typescript.json';
import nodejsSkill from '../skills-bank/nodejs.json';
import pythonSkill from '../skills-bank/python.json';
import dockerSkill from '../skills-bank/docker.json';
import dotnetSkill from '../skills-bank/dotnet.json';
import javaSkill from '../skills-bank/java.json';
import awsSkill from '../skills-bank/aws.json';
import postgresqlSkill from '../skills-bank/postgresql.json';
import rustSkill from '../skills-bank/rust.json';

const SKILLS_MAP: Record<string, Skill> = {
  react: reactSkill as Skill,
  typescript: typescriptSkill as Skill,
  nodejs: nodejsSkill as Skill,
  python: pythonSkill as Skill,
  docker: dockerSkill as Skill,
  dotnet: dotnetSkill as Skill,
  java: javaSkill as Skill,
  aws: awsSkill as Skill,
  postgresql: postgresqlSkill as Skill,
  rust: rustSkill as Skill,
};

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

export default function SkillDetailPage() {
  const params = useParams();
  const skillId = params.skillId as string;
  const skill = SKILLS_MAP[skillId];

  if (!skill) {
    return (
      <div style={{ color: 'var(--text-primary)' }}>
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
        <h1 className="mb-4 text-3xl font-bold">Skill Not Found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          The skill &quot;{skillId}&quot; could not be found.
        </p>
      </div>
    );
  }

  const progress = getProgressPercentage(skill.currentLevel);
  const gradientClass = getLevelColor(skill.currentLevel);

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      {/* Back Link */}
      <Link 
        href="/skill-tree"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Skill Tree
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{skill.name}</h1>
          <span
            className={`rounded-full bg-gradient-to-r ${gradientClass} px-4 py-1 text-sm font-semibold text-white shadow-sm`}
          >
            {skill.currentLevel}
          </span>
        </div>
        <p className="text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {skill.category}
        </p>
      </div>

      {/* Description */}
      {skill.description && (
        <div
          className="mb-8 overflow-hidden rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <h2 className="mb-3 text-lg font-semibold">About This Skill</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{skill.description}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div
        className="mb-8 overflow-hidden rounded-xl border p-6"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h2 className="mb-4 text-lg font-semibold">Skill Progression</h2>
        <div className="mb-2 flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Script Kitty</span>
          <span style={{ color: 'var(--text-muted)' }}>Fellow</span>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--border-color)' }}
        >
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between">
          {SKILL_LEVELS.map((level, index) => (
            <div
              key={level}
              className={`flex flex-col items-center ${
                getLevelIndex(skill.currentLevel) >= index ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full ${
                  getLevelIndex(skill.currentLevel) >= index
                    ? `bg-gradient-to-r ${gradientClass}`
                    : ''
                }`}
                style={
                  getLevelIndex(skill.currentLevel) < index
                    ? { backgroundColor: 'var(--border-color)' }
                    : undefined
                }
              />
              <span className="mt-1 hidden text-xs sm:block" style={{ color: 'var(--text-muted)' }}>
                {level.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div
        className="mb-8 overflow-hidden rounded-xl border p-6"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <h2 className="mb-4 text-lg font-semibold">Experience</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {skill.yearsOfExperience}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Years of Experience</div>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {skill.yearsOfProfessionalExperience}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Years Professional</div>
          </div>
          <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {skill.employabilityScore}/10
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Employability Score</div>
          </div>
        </div>
      </div>

      {/* Projects */}
      {skill.projects && skill.projects.length > 0 && (
        <div
          className="overflow-hidden rounded-xl border p-6"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <h2 className="mb-4 text-lg font-semibold">Featured Work</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {skill.projects.map((project, index) => (
              <Link
                key={index}
                href={project.url}
                className="group rounded-lg border p-4 transition-all hover:shadow-md"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <h3 className="mb-2 font-semibold group-hover:opacity-80">{project.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {project.description}
                </p>
                <span
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  View Project
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
