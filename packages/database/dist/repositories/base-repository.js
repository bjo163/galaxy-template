export class BaseRepository {
    modelClass;
    knex;
    constructor(modelClass, knex) {
        this.modelClass = modelClass;
        this.knex = knex;
    }
    query(transaction) {
        return this.modelClass.query(transaction ?? this.knex);
    }
    findById(id, transaction) {
        return this.query(transaction).findById(id);
    }
    insert(data, transaction) {
        return this.query(transaction).insert(data);
    }
    patchById(id, data, transaction) {
        return this.query(transaction).patchAndFetchById(id, data);
    }
    deleteById(id, transaction) {
        return this.query(transaction).deleteById(id);
    }
}
//# sourceMappingURL=base-repository.js.map