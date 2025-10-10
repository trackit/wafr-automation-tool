import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

import { Organization } from '@backend/models';

@Entity('organizations')
export class OrganizationEntity implements Organization {
  @PrimaryColumn('varchar')
  domain!: string;

  @Column('varchar')
  name!: string;

  @Column('varchar', { nullable: true })
  accountId?: string;

  @Column('varchar', { nullable: true })
  assessmentExportRoleArn?: string;

  @Column('varchar', { nullable: true })
  unitBasedAgreementId?: string;

  @Column('int', { nullable: true })
  freeAssessmentsLeft?: number;

  @OneToOne(
    () => AceIntegrationEntity,
    (aceIntegration) => aceIntegration.organization,
    { cascade: true, nullable: true },
  )
  aceIntegration?: AceIntegrationEntity;
}

@Entity('ace_integration')
export class AceIntegrationEntity {
  @PrimaryColumn('varchar')
  domain!: string;

  @OneToOne(
    () => OrganizationEntity,
    (organization) => organization.aceIntegration,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'domain', referencedColumnName: 'domain' })
  organization!: OrganizationEntity;

  @Column('varchar', { nullable: false })
  roleArn!: string;

  @Column('varchar', { nullable: false, array: true, default: [] })
  solutions!: string[];

  @OneToMany(
    () => OpportunityTeamMemberEntity,
    (opportunityTeamMember) => opportunityTeamMember.aceIntegration,
    {
      cascade: true,
    },
  )
  opportunityTeamMembers!: OpportunityTeamMemberEntity[];
}

@Entity('opportunity_team_members')
export class OpportunityTeamMemberEntity {
  @PrimaryColumn('varchar')
  domain!: string;

  @ManyToOne(
    () => AceIntegrationEntity,
    (aceIntegration) => aceIntegration.opportunityTeamMembers,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'domain', referencedColumnName: 'domain' })
  aceIntegration!: AceIntegrationEntity;

  @Column('varchar', { nullable: false })
  firstName!: string;

  @Column('varchar', { nullable: false })
  lastName!: string;

  @Column('varchar', { nullable: false })
  email!: string;
}

export const organizationsEntities = [
  OrganizationEntity,
  AceIntegrationEntity,
  OpportunityTeamMemberEntity,
];
