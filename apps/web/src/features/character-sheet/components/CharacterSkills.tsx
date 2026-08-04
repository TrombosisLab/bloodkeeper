import { demoSkills } from '../data/demo-skills'

import type {
  CharacterSkillCategory,
} from '../types/character-skills.types'

import { SkillRow } from './SkillRow'

interface CharacterSkillsProps {
  skills?: CharacterSkillCategory[]
}

export function CharacterSkills({
  skills = demoSkills,
}: CharacterSkillsProps) {
  return (
    <section
      className="sheet-section skills-section"
      aria-labelledby="skills-title"
    >
      <div className="section-title">
        <div>
          <p className="section-kicker">
            Capacidades aprendidas
          </p>

          <h2 id="skills-title">
            Habilidades
          </h2>
        </div>

        <span className="section-number">
          02
        </span>
      </div>

      <div className="skills-grid">
        {skills.map((category) => (
          <div
            className="skill-category"
            key={category.key}
          >
            <h3>{category.label}</h3>

            <div className="skill-category__rows">
              {category.skills.map((skill) => (
                <SkillRow
                  key={skill.key}
                  label={skill.label}
                  value={skill.value}
                  specialties={
                    skill.specialties
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
