import * as mongodb from 'mongodb';

export type ValueFetchOperator = '$first' | '$last' | '$max' | '$min' | '$avg' | '$push' | '$addToSet';

type SpecialFieldIdentifier = 'timestamp';

/**
 * MongoDB query builder
 */
export class QueryBuilder
{
    private _components: any[] = [];
    private specialFields: Map<SpecialFieldIdentifier, string> = new Map();

    /**
     * Register a special field that can be used in the query builder
     * @param identifier The identifier for the special field
     * @param field The actual field name
     */
    public registerSpecialField(identifier: SpecialFieldIdentifier, field: string): QueryBuilder
    {
        this.specialFields.set(identifier, field);
        return this;
    }

    /**
     * Inserts the components of another query builder into this one at the specified index
     * @param builder The builder to insert
     * @param index The index to insert at
     */
    public insertBuilder(builder: QueryBuilder, index: number = 0): QueryBuilder
    {
        this._components.splice(index, 0, ...builder._components);
        return this;
    }

    public select(...fields: string[]): QueryBuilder
    {
        let projection: any = {
            _id: 1 // TODO: Is this correct?
        };
        for (const field of fields)
        {
            projection[ field ] = 1;
        }
        this._components.push({ $project: projection });
        return this;
    }

    /**
     * Exclude fields from the query
     * @param fields The fields to exclude
     */
    public exclude(...fields: string[]): QueryBuilder
    {
        let projection: any = {};
        for (const field of fields)
        {
            projection[ field ] = 0;
        }
        this._components.push({ $project: projection });
        return this;
    }

    /**
     * Selects documents where the specified field is equal to the specified value
     * @param field The field to check
     * @param value The value to check for
     */
    public selectWhereFieldEquals(field: string, value: any): QueryBuilder
    {
        this._components.push({ $match: { [ field ]: value } });
        return this;
    }

    /**
     * Selects documents where the value of the specified field is present in the given array of values
     * @param field The field to check
     * @param values The values to check for
     */
    public selectWhereValueOfFieldIsIn(field: string, values: any[]): QueryBuilder
    {
        this._components.push({ $match: { [ field ]: { $in: values } } });
        return this;
    }

    /**
     * Renames a field
     * @param field The field to rename
     * @param newField The new name of the field
     */
    public rename(field: string, newField: string): QueryBuilder
    {
        if (field === newField)
        {
            return this;
        }
        this._components.push({ $addFields: { [ newField ]: `$${field}` } });
        this._components.push({ $project: { [ field ]: 0 } });
        return this;
    }

    /**
     * Selects the last n documents by the specified index field
     * @param count The number of documents to select
     * @param indexField The field to use for indexing
     */
    public takeLast(count: number, indexField: string = '_id'): QueryBuilder
    {
        count = Math.ceil(count);
        this._components.push({ $sort: { [ indexField ]: -1 } });
        this._components.push({ $limit: count });
        return this;
    }

    /**
     * Overwrites the value of a field with the value of another field
     * @param destinationField The field to overwrite
     * @param withField The field to overwrite with
     * @returns 
     */
    public overwrite(destinationField: string, withField: string)
    {
        this._components.push({ $addFields: { [ destinationField ]: `$${withField}` } });
        return this;
    }

    /**
     * Groups documents by the specified field
     * @param field The field to group by
     * @param value The value to group by
     * @param operator The operator to use for the value
     * @returns 
     */
    public group(field: string, value: any, operator: ValueFetchOperator = "$first"): QueryBuilder
    {
        this._components.push({ $group: { _id: `$${field}`, [ field ]: { operator: `$${field}` } } });
        return this;
    }

    /**
     * Forces the specified field to be treated as a date
     * @param field The field to treat as a date
     * @returns 
     */
    public treatFieldAsDate(field?: string): QueryBuilder
    {
        let target: string | null = null;
        if (field)
        {
            target = field;
        }
        else if (this.specialFields.has('timestamp'))
        {
            const timestampField = this.specialFields.get('timestamp');
            if (timestampField)
            {
                target = timestampField;
            }
            else
            {
                throw new Error('Timestamp field not registered');
            }
        }
        else
        {
            throw new Error('Unable to determine target field');
        }
        this._components.push({ $addFields: { [ target ]: { $toDate: `$${target}` } } });
        return this;
    }

    /**
     * Sorts the documents by the specified field
     * @param field The field to sort by
     * @param order The order to sort in
     * @returns 
     */
    public sort(field: string, order: 1 | -1 = 1): QueryBuilder 
    {
        this._components.push({ $sort: { [ field ]: order } });
        return this;
    }

    /**
     * Limits the number of documents returned by the query
     * @param limit The maximum number of documents to return
     * @returns 
     */
    public limit(limit: number): QueryBuilder
    {
        this._components.push({ $limit: limit });
        return this;
    }

    /**
     * Constrain the results to a date range
     * @param from The start of the date range
     * @param to The end of the date range
     * @returns 
     */
    public constrainResultsToDateRange(from: Date, to: Date): QueryBuilder
    {
        const field = this.specialFields.get('timestamp');
        if (!field)
        {
            throw new Error('Timestamp field not registered');
        }
        this._components.push({ $match: { [ field ]: { $gte: from, $lt: to } } });
        return this;
    }

    /**
     * Renames multiple fields
     * @param operations The operations to perform
     * @returns 
     */
    public renameFields(...operations: { oldField: string, newField: string; }[]): QueryBuilder
    {
        for (const operation of operations)
        {
            if (operation.oldField === operation.newField) continue;
            this._components.push({ $addFields: { [ operation.newField ]: `$${operation.oldField}` } });
            this._components.push({ $project: { [ operation.oldField ]: 0 } });
        }
        return this;
    }

    // public prefixFieldsFromDocument(prefixSourceField: string, prefixTargetFields: string[]): QueryBuilder
    // {
    //     // Prefix the name of a field with the value of another field, and use it as the new field name
    //     for (const prefixTargetField of prefixTargetFields)
    //     {
    //         this._components.push({
    //             $addFields: {
    //                 [ prefixTargetField ]: {
    //                     $concat: [
    //                         `$${prefixSourceField}`, `_${prefixTargetField}`
    //                     ]
    //                 }
    //             }
    //         });
    //     }
    //     return this;
    // }

    /**
     * Removes the specified fields from the query
     * @param fields The fields to remove
     * @returns 
     */
    public removeFields(...fields: string[]): QueryBuilder
    {
        for (const field of fields)
        {
            this._components.push({ $project: { [ field ]: 0 } });
        }
        return this;
    }

    /**
     * Manually adds a stage to the query
     * @param stage The stage to add
     * @returns 
     */
    public manuallyAddStage(stage: any): QueryBuilder
    {
        this._components.push(stage);
        return this;
    }

    /**
     * Strips the DBID from the query results
     * @returns 
     */
    public stripDBID(): QueryBuilder 
    {
        this._components.push({ $project: { _id: 0 } });
        return this;
    }

    /**
     * Executes the query on the specified collection
     * @param collection The collection to execute the query on
     * @returns The results of the query, as an array
     * @deprecated Manaully execute the query using the MongoDB driver and the 'components' property
     */
    public async execute(collection: mongodb.Collection): Promise<any[]>
    {
        return await collection.aggregate(this._components).toArray();
    }

    /**
     * The components of the query
     */
    public get components(): any[]
    {
        return this._components;
    }
}