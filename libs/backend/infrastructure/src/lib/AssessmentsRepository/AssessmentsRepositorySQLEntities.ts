import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import {
  Assessment,
  AssessmentFileExport,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  BestPractice,
  Pillar,
  Question,
  SeverityType,
} from '@backend/models';

@Entity('assessments')
export class AssessmentEntity implements Omit<Assessment, 'organization'> {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  createdBy!: string;

  @Column('varchar')
  executionArn!: string;

  @Column('timestamptz')
  createdAt!: Date;

  @Column('varchar')
  name!: string;

  @Column('varchar', { nullable: true })
  questionVersion?: string;

  @Column({ type: 'jsonb', nullable: false, default: [] })
  regions!: string[];

  @Column('varchar', { nullable: true })
  exportRegion?: string;

  @Column('varchar')
  roleArn!: string;

  @Column('boolean', { default: false })
  finished!: boolean;

  @Column({ type: 'jsonb', nullable: false, default: [] })
  workflows!: string[];

  @Column({ type: 'jsonb', nullable: true })
  error?: { cause: string; error: string };

  @OneToMany(() => PillarEntity, (pillar) => pillar.assessment, {
    cascade: true,
  })
  pillars!: PillarEntity[];

  @OneToMany(() => FileExportEntity, (fileExport) => fileExport.assessment, {
    cascade: true,
  })
  fileExports!: FileExportEntity[];
}

@Entity('pillars')
export class PillarEntity implements Omit<Pillar, 'organization'> {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  id!: string;

  @ManyToOne(() => AssessmentEntity, (assessment) => assessment.pillars, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'assessmentId', referencedColumnName: 'id' }])
  assessment!: AssessmentEntity;

  @Column('boolean')
  disabled!: boolean;

  @Column('varchar')
  label!: string;

  @Column('varchar')
  primaryId!: string;

  @OneToMany(() => QuestionEntity, (question) => question.pillar, {
    cascade: true,
  })
  questions!: QuestionEntity[];
}

@Entity('questions')
export class QuestionEntity implements Question {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  pillarId!: string;

  @PrimaryColumn('varchar')
  id!: string;

  @ManyToOne(() => PillarEntity, (pillar) => pillar.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'pillarId', referencedColumnName: 'id' },
    { name: 'assessmentId', referencedColumnName: 'assessmentId' },
  ])
  pillar!: PillarEntity;

  @Column('boolean')
  disabled!: boolean;

  @Column('varchar')
  label!: string;

  @Column('boolean')
  none!: boolean;

  @Column('varchar')
  primaryId!: string;

  @OneToMany(() => BestPracticeEntity, (bp) => bp.question, { cascade: true })
  bestPractices!: BestPracticeEntity[];
}

@Entity('bestPractices')
export class BestPracticeEntity implements BestPractice {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  questionId!: string;

  @PrimaryColumn('varchar')
  pillarId!: string;

  @PrimaryColumn('varchar')
  id!: string;

  @ManyToOne(() => QuestionEntity, (question) => question.bestPractices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'questionId', referencedColumnName: 'id' },
    { name: 'pillarId', referencedColumnName: 'pillarId' },
    { name: 'assessmentId', referencedColumnName: 'assessmentId' },
  ])
  question!: QuestionEntity;

  @Column('varchar')
  description!: string;

  @Column('varchar')
  label!: string;

  @Column('varchar')
  primaryId!: string;

  @Column('varchar')
  risk!: SeverityType;

  @Column('boolean')
  checked!: boolean;
}

@Entity('fileExports')
export class FileExportEntity implements AssessmentFileExport {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar')
  type!: AssessmentFileExportType;

  @ManyToOne(() => AssessmentEntity, (assessment) => assessment.pillars, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'assessmentId', referencedColumnName: 'id' }])
  assessment!: AssessmentEntity;

  @Column('varchar')
  status!: AssessmentFileExportStatus;

  @Column('varchar', { nullable: true })
  error?: string;

  @Column('varchar')
  versionName!: string;

  @Column('varchar', { nullable: true })
  objectKey?: string;

  @Column('timestamptz')
  createdAt!: Date;
}

export const assessmentsEntities = [
  AssessmentEntity,
  PillarEntity,
  QuestionEntity,
  BestPracticeEntity,
  FileExportEntity,
];
