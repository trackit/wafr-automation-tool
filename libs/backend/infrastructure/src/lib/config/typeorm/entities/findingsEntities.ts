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
} from 'typeorm';

import {
  Finding,
  FindingComment,
  FindingRemediation,
  FindingResource,
  SeverityType,
} from '@backend/models';

import { BestPracticeEntity } from './assessmentsEntities';

@Entity('findings')
export class FindingEntity implements Omit<Finding, 'bestPractices'> {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  id!: string;

  @ManyToMany(() => BestPracticeEntity)
  @JoinTable({
    name: 'findingBestPractices',
    joinColumns: [
      { name: 'findingAssessmentId', referencedColumnName: 'assessmentId' },
      { name: 'findingId', referencedColumnName: 'id' },
    ],
    inverseJoinColumns: [
      { name: 'bestPracticeAssessmentId', referencedColumnName: 'assessmentId' },
      { name: 'questionId', referencedColumnName: 'questionId' },
      { name: 'pillarId', referencedColumnName: 'pillarId' },
      { name: 'bestPracticeId', referencedColumnName: 'id' },
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
