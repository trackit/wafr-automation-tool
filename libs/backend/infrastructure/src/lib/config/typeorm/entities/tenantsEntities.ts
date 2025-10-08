import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

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
}

@Entity('tenants')
export class Tenant {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar', { unique: true })
  databaseName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

export const tenantsEntities = [OrganizationEntity, Tenant];
