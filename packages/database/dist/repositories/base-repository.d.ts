import type { Knex } from "knex";
import { Model, type ModelClass } from "objection";
export declare abstract class BaseRepository<TModel extends Model> {
    protected readonly modelClass: ModelClass<TModel>;
    protected readonly knex: Knex;
    constructor(modelClass: ModelClass<TModel>, knex: Knex);
    query(transaction?: Knex.Transaction): import("objection").QueryBuilderType<TModel>;
    findById(id: string | number, transaction?: Knex.Transaction): import("objection").MaybeSingleQueryBuilder<import("objection").QueryBuilderType<TModel>>;
    insert(data: Partial<TModel>, transaction?: Knex.Transaction): import("objection").SingleQueryBuilder<import("objection").QueryBuilderType<TModel>>;
    patchById(id: string | number, data: Partial<TModel>, transaction?: Knex.Transaction): import("objection").SingleQueryBuilder<import("objection").QueryBuilderType<TModel>>;
    deleteById(id: string | number, transaction?: Knex.Transaction): import("objection").NumberQueryBuilder<import("objection").MaybeSingleQueryBuilder<import("objection").QueryBuilderType<TModel>>>;
}
