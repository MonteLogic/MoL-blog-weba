export type SkillLevel = 
  | 'Script Kitty'
  | 'Staff Engineer'
  | 'Senior'
  | 'Distinguished Engineer'
  | 'Fellow';

export const SKILL_LEVELS: SkillLevel[] = [
  'Script Kitty',
  'Staff Engineer',
  'Senior',
  'Distinguished Engineer',
  'Fellow',
];

export interface Project {
  title: string;
  description: string;
  url: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  currentLevel: SkillLevel;
  yearsOfExperience: number | string; // Supports "<1", "1-2", or numeric values
  yearsOfProfessionalExperience: number | string;
  employabilityScore: number; // 1-10, higher is easier to employ
  employabilityScoreId?: string; // Reference to gist-defined score criteria
  description?: string;
  projects?: Project[];
}

export type SortOption = 
  | 'easiest-to-employ'
  | 'years-of-experience'
  | 'years-of-professional-experience';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'easiest-to-employ', label: 'Easiest To Employ' },
  { value: 'years-of-experience', label: 'Years of Experience' },
  { value: 'years-of-professional-experience', label: 'Years of Professional Experience' },
];
