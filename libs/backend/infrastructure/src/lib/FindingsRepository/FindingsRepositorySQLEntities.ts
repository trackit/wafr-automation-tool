import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
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

  @Column('varchar')
  eventCode?: string;

  @Column('varchar')
  riskDetails!: string;

  @Column('varchar')
  severity!: SeverityType;

  @Column('varchar')
  statusCode!: string;

  @Column('varchar')
  statusDetail!: string;

  @OneToOne(() => FindingRemediationEntity, (c) => c.finding, {
    cascade: true,
  })
  remediation?: FindingRemediationEntity;

  @OneToMany(() => FindingResourceEntity, (c) => c.finding, {
    cascade: true,
  })
  resources!: FindingResourceEntity[];

  @OneToMany(() => FindingCommentEntity, (c) => c.finding, { cascade: true })
  comments?: FindingCommentEntity[];
}

@Entity('findingRemediations')
export class FindingRemediationEntity implements FindingRemediation {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  findingId!: string;

  @Column('varchar')
  desc!: string;

  @Column({ type: 'jsonb', nullable: false, default: [] })
  references?: string[];

  @ManyToOne(() => FindingEntity, (f) => f.comments, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'findingId', referencedColumnName: 'id' },
    { name: 'assessmentId', referencedColumnName: 'assessmentId' },
  ])
  finding!: FindingEntity;
}

@Entity('findingResources')
export class FindingResourceEntity implements FindingResource {
  @PrimaryColumn('uuid')
  assessmentId!: string;

  @PrimaryColumn('varchar')
  findingId!: string;

  @Column('varchar')
  name?: string;

  @Column('varchar')
  region!: string;

  @Column('varchar')
  type?: string;

  @Column('varchar')
  uid?: string;

  @ManyToOne(() => FindingEntity, (f) => f.comments, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'findingId', referencedColumnName: 'id' },
    { name: 'assessmentId', referencedColumnName: 'assessmentId' },
  ])
  finding!: FindingEntity;
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

export const findingEntities = [
  FindingEntity,
  FindingCommentEntity,
  FindingRemediationEntity,
  FindingResourceEntity,
];
