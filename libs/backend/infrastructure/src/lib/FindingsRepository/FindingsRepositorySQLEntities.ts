import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import {
  Finding,
  FindingComment,
  FindingRemediation,
  FindingResource,
  SeverityType,
} from '@backend/models';

import { BestPracticeEntity } from '../AssessmentsRepository/AssessmentsRepositorySQLEntities';

@Entity('findings')
@Unique('uq_findings_pk', ['assessmentId', 'id'])
@Index('ix_findings_assessment_id', ['assessmentId', 'id'])
export class FindingEntity implements Finding {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  id!: string;

  @ManyToMany(() => BestPracticeEntity)
  @JoinTable({
    name: 'findingBestPractices',
    joinColumns: [
      { name: 'finding_assessment_id', referencedColumnName: 'assessmentId' },
      { name: 'finding_id', referencedColumnName: 'id' },
    ],
    inverseJoinColumns: [
      { name: 'bp_assessment_id', referencedColumnName: 'assessmentId' },
      { name: 'bp_question_id', referencedColumnName: 'questionId' },
      { name: 'bp_pillar_id', referencedColumnName: 'pillarId' },
      { name: 'bp_id', referencedColumnName: 'id' },
    ],
  })
  bestPractices!: BestPracticeEntity[];

  @Column('boolean')
  hidden!: boolean;

  @Column('boolean')
  isAIAssociated!: boolean;

  @Column('varchar', { nullable: true })
  eventCode?: string;

  @Column('text')
  riskDetails!: string;

  @Column({ type: 'enum', enum: SeverityType })
  severity!: SeverityType;

  @Column('varchar')
  statusCode!: string;

  @Column('text')
  statusDetail!: string;

  @OneToOne(() => FindingRemediationEntity, (rem) => rem.finding, {
    cascade: true,
    nullable: true,
  })
  remediation?: FindingRemediationEntity;

  @OneToMany(() => FindingResourceEntity, (res) => res.finding, {
    cascade: true,
  })
  resources!: FindingResourceEntity[];

  @OneToMany(() => FindingCommentEntity, (com) => com.finding, {
    cascade: true,
  })
  comments!: FindingCommentEntity[];
}

@Entity('findingRemediations')
@Unique('uq_findingRemediations_pk', ['assessmentId', 'findingId'])
@Index('ix_findingRemediations_fk', ['assessmentId', 'findingId'])
export class FindingRemediationEntity implements FindingRemediation {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  findingId!: string;

  @Column('text')
  desc!: string;

  @Column({ type: 'jsonb', nullable: false, default: [] })
  references!: string[];

  @OneToOne(() => FindingEntity, (f) => f.remediation, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'findingId', referencedColumnName: 'id' },
    { name: 'assessmentId', referencedColumnName: 'assessmentId' },
  ])
  finding!: FindingEntity;
}

@Entity('findingResources')
@Unique('uq_findingResources_pk', ['id'])
@Index('ix_findingResources_fk', ['assessmentId', 'findingId'])
export class FindingResourceEntity implements FindingResource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  assessmentId!: string;

  @Column('varchar')
  findingId!: string;

  @Column('varchar', { nullable: true })
  name?: string;

  @Column('varchar', { nullable: true })
  region?: string;

  @Column('varchar', { nullable: true })
  type?: string;

  @Column('varchar', { nullable: true })
  uid?: string;

  @ManyToOne(() => FindingEntity, (f) => f.resources, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'findingId', referencedColumnName: 'id' },
    { name: 'assessmentId', referencedColumnName: 'assessmentId' },
  ])
  finding!: FindingEntity;
}

@Entity('findingComments')
@Unique('uq_findingComments_pk', ['id'])
@Index('ix_findingComments_fk', ['assessmentId', 'findingId'])
export class FindingCommentEntity implements FindingComment {
  @PrimaryColumn('uuid')
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

export const findingEntities = [
  FindingEntity,
  FindingCommentEntity,
  FindingRemediationEntity,
  FindingResourceEntity,
];
