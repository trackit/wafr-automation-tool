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
  AssessmentGraphData,
  AssessmentStep,
  BestPractice,
  Pillar,
  Question,
  ScanningTool,
  SeverityType,
} from '@backend/models';

@Entity('assessments')
export class AssessmentEntity
  implements
    Omit<
      Assessment,
      'organization' | 'fileExports' | 'rawGraphData' | 'graphData'
    >
{
  @PrimaryColumn('uuid')
  id!: string;

  @Column('varchar')
  createdBy!: string;

  @Column('varchar')
  executionArn!: string;

  @Column('timestamptz', { default: () => 'now()' })
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

  @Column({ type: 'jsonb', nullable: false, default: [] }) // TODO : check the json declararation
  workflows!: string[];

  @Column({ type: 'jsonb', nullable: true })
  error?: { cause: string; error: string };

  @Column({ type: 'enum', enum: AssessmentStep })
  step!: AssessmentStep;

  @OneToMany(() => PillarEntity, (pillar) => pillar.assessment, {
    cascade: true,
  })
  pillars!: PillarEntity[];

  @OneToMany(() => FileExportEntity, (fileExport) => fileExport.assessment, {
    cascade: true,
  })
  fileExports?: FileExportEntity[];

  @Column({ type: 'jsonb', nullable: true })
  rawGraphData?: Record<ScanningTool, AssessmentGraphData>;

  @Column({ type: 'jsonb', nullable: true })
  graphData?: AssessmentGraphData;

  @Column('varchar', { nullable: true })
  wafrWorkloadArn?: string;

  @Column('varchar', { nullable: true })
  opportunityId?: string;
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

  @Column('boolean', { default: false })
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

  @Column('boolean', { default: false })
  disabled!: boolean;

  @Column('varchar')
  label!: string;

  @Column('boolean', { default: false })
  none!: boolean;

  @Column('varchar')
  primaryId!: string;

  @OneToMany(() => BestPracticeEntity, (bp) => bp.question, { cascade: true })
  bestPractices!: BestPracticeEntity[];
}

@Entity('bestPractices')
export class BestPracticeEntity implements Omit<BestPractice, 'results'> {
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

  @Column('text')
  description!: string;

  @Column('varchar')
  label!: string;

  @Column('varchar')
  primaryId!: string;

  @Column({ type: 'enum', enum: SeverityType })
  risk!: SeverityType;

  @Column('boolean', { default: false })
  checked!: boolean;

  @Column('varchar', { array: true, default: [] })
  results!: string[];
}

@Entity('fileExports')
export class FileExportEntity implements AssessmentFileExport {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  id!: string;

  @Column({ type: 'enum', enum: AssessmentFileExportType })
  type!: AssessmentFileExportType;

  @ManyToOne(() => AssessmentEntity, (assessment) => assessment.fileExports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'assessmentId', referencedColumnName: 'id' }])
  assessment?: AssessmentEntity;

  @Column({ type: 'enum', enum: AssessmentFileExportStatus })
  status!: AssessmentFileExportStatus;

  @Column('varchar', { nullable: true })
  error?: string;

  @Column('varchar')
  versionName!: string;

  @Column('varchar', { nullable: true })
  objectKey?: string;

  @Column('timestamptz', { default: () => 'now()' })
  createdAt!: Date;
}

export const assessmentsEntities = [
  AssessmentEntity,
  PillarEntity,
  QuestionEntity,
  BestPracticeEntity,
  FileExportEntity,
];
