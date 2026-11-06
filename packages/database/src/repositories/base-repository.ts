import type { Knex } from "knex";
import { Model, type ModelClass } from "objection";

export abstract class BaseRepository<TModel extends Model> {
  constructor(
    protected readonly modelClass: ModelClass<TModel>,
    protected readonly knex: Knex,
  ) {}

  query(transaction?: Knex.Transaction) {
    return this.modelClass.query(transaction ?? this.knex);
  }

  findById(id: string | number, transaction?: Knex.Transaction) {
    return this.query(transaction).findById(id);
  }

  insert(data: Partial<TModel>, transaction?: Knex.Transaction) {
    return this.query(transaction).insert(data);
  }

  patchById(
    id: string | number,
    data: Partial<TModel>,
    transaction?: Knex.Transaction,
  ) {
    return this.query(transaction).patchAndFetchById(id, data);
  }

  deleteById(id: string | number, transaction?: Knex.Transaction) {
    return this.query(transaction).deleteById(id);
  }
}
