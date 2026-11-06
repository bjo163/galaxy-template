import { Model } from "objection";
export declare abstract class BaseModel extends Model {
    static columnNameMappers: import("objection").ColumnNameMappers;
    createdAt: Date;
    updatedAt: Date;
    $beforeInsert(): Promise<void>;
    $beforeUpdate(): Promise<void>;
}
