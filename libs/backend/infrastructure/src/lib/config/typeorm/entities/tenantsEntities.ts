import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar', { unique: true })
  databaseName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
