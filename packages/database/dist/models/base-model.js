import { Model, snakeCaseMappers } from "objection";
export class BaseModel extends Model {
    static columnNameMappers = snakeCaseMappers();
    createdAt;
    updatedAt;
    async $beforeInsert() {
        const now = new Date();
        this.createdAt ??= now;
        this.updatedAt ??= now;
    }
    async $beforeUpdate() {
        this.updatedAt = new Date();
    }
}
//# sourceMappingURL=base-model.js.map