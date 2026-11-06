import { Model, snakeCaseMappers } from "objection";

export abstract class BaseModel extends Model {
  static columnNameMappers = snakeCaseMappers();

  createdAt!: Date;
  updatedAt!: Date;

  async $beforeInsert(): Promise<void> {
    const now = new Date();
    this.createdAt ??= now;
    this.updatedAt ??= now;
  }

  async $beforeUpdate(): Promise<void> {
    this.updatedAt = new Date();
  }
}
