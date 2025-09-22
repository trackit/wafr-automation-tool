import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import type {
  Assessment,
  AssessmentGraphData,
  AssessmentStep,
  BestPractice,
  Finding,
  FindingComment,
  Pillar,
  Question,
  ScanningTool,
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

  @Column({ type: 'jsonb', nullable: true })
  graphData?: AssessmentGraphData;

  @Column('varchar')
  name!: string;

  @Column('varchar', { nullable: true })
  questionVersion?: string;

  @Column({ type: 'jsonb', nullable: false, default: {} })
  rawGraphData!: Partial<Record<ScanningTool, AssessmentGraphData>>;

  @Column('text', {
    array: false,
    nullable: false,
    default: '',
    transformer: {
      to: (value?: string[]) => (value && value.length ? value.join(',') : ''),
      from: (value: string) => (value ? value.split(',').filter(Boolean) : []),
    },
  })
  regions!: string[];

  @Column('varchar', { nullable: true })
  exportRegion?: string;

  @Column('varchar')
  roleArn!: string;

  @Column('varchar')
  step!: AssessmentStep;

  @Column('text', {
    array: false,
    nullable: false,
    default: '',
    transformer: {
      to: (value?: string[]) => (value && value.length ? value.join(',') : ''),
      from: (value: string) => (value ? value.split(',').filter(Boolean) : []),
    },
  })
  workflows!: string[];

  @Column({ type: 'jsonb', nullable: true })
  error?: { cause: string; error: string };

  @OneToMany(() => PillarEntity, (pillar) => pillar.assessment, {
    cascade: true,
  })
  pillars?: PillarEntity[];
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

  @Column('text', {
    array: false,
    nullable: false,
    default: '',
    transformer: {
      to: (value?: Set<string> | string[]) => {
        const list = Array.isArray(value) ? value : Array.from(value ?? []);
        return list.length ? list.join(',') : '';
      },
      from: (value: string) =>
        new Set(value ? value.split(',').filter(Boolean) : []),
    },
  })
  results!: Set<string>;

  @Column('varchar')
  risk!: SeverityType;

  @Column('boolean')
  checked!: boolean;
}

@Entity('findings')
export class FindingEntity implements Finding {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  id!: string;

  @Index()
  @Column('varchar')
  bestPractices!: string;

  @Column('boolean')
  hidden!: boolean;

  @Column('boolean')
  isAIAssociated!: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      to: (v?) => v,
      from: (v) => (v === null ? undefined : v),
    },
  })
  metadata?: { eventCode?: string };

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      to: (v?) => v,
      from: (v) => (v === null ? undefined : v),
    },
  })
  remediation?: { desc: string; references?: string[] };

  @Column({
    type: 'jsonb',
    nullable: true,
    transformer: {
      to: (v?) => v,
      from: (v) => (v === null ? undefined : v),
    },
  })
  resources?: Array<{
    name?: string;
    region?: string;
    type?: string;
    uid?: string;
  }>;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (v?: string) => v,
      from: (v: string | null) => (v === null ? undefined : v),
    },
  })
  riskDetails?: string;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: {
      to: (v?: string) => v,
      from: (v: string | null) => (v === null ? undefined : v),
    },
  })
  severity?: SeverityType;

  @Column({
    type: 'varchar',
    nullable: true,
    transformer: {
      to: (v?: string) => v,
      from: (v: string | null) => (v === null ? undefined : v),
    },
  })
  statusCode?: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (v?: string) => v,
      from: (v: string | null) => (v === null ? undefined : v),
    },
  })
  statusDetail?: string;

  @OneToMany(() => FindingCommentEntity, (c) => c.finding, { cascade: true })
  comments?: FindingCommentEntity[];
}

@Entity('findingComments')
export class FindingCommentEntity implements FindingComment {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('uuid')
  assessmentId!: string;

  @Column('varchar')
  findingId!: string;

  @ManyToOne(() => FindingEntity, (f) => f.comments, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'findingId', referencedColumnName: 'id' },
    { name: 'assessmentId', referencedColumnName: 'assessmentId' },
  ])
  finding!: FindingEntity;

  @Column('varchar')
  authorId!: string;

  @Column('text')
  text!: string;

  @Column('timestamptz')
  createdAt!: Date;
}

export const entities = [
  AssessmentEntity,
  PillarEntity,
  QuestionEntity,
  BestPracticeEntity,
  FindingEntity,
  FindingCommentEntity,
];
