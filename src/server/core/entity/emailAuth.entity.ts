/* */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'

/* */
import { EmailAuthType, UserRole } from '@/types'

@Entity('email_auths')
export default class EmailAuth {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 255 })
  code!: string

  @Column({ length: 255 })
  email!: string

  @Column('uuid', { nullable: true })
  userId: string

  @Column('enum', { enum: EmailAuthType, default: EmailAuthType.Register })
  type!: EmailAuthType

  @Column('enum', { enum: UserRole, default: UserRole.User })
  asRole!: UserRole

  @Column({ default: false })
  isVerified!: boolean

  @Column('timestampz')
  @CreateDateColumn()
  createdTime!: Date

  @Column('timestamptz')
  @UpdateDateColumn()
  updatedTime!: Date
}