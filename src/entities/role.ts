import {Entity, PrimaryColumn, Column, BaseEntity} from 'typeorm';

// Role table

@Entity('role')
export class Role extends BaseEntity {
    @PrimaryColumn()
    roleId! : number;

    @Column()
    roleDescription! : string;
}
